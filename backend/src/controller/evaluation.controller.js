import sequelize from '../config/db.js';
import XLSX from 'xlsx';
import Evaluation from '../model/evaluation/evaluation.model.js';
import EvaluationLecturer from '../model/evaluation/evaluationLecturer.model.js';
import EvaluationSubmission from '../model/evaluation/evaluationSubmission.model.js';
import LecturerEvaluation from '../model/evaluation/lecturerEvaluation.model.js';
import EvaluationResponse from '../model/evaluation/evaluationResponse.model.js';
import EvaluationQuestion from '../model/evaluation/evaluationQuestion.model.js';
import CourseMapping from '../model/courseMapping.model.js';
import LecturerProfile from '../model/lecturerProfile.model.js';
import Specialization from '../model/specialization.model.js';
import ClassModel from '../model/class.model.js';
import Course from '../model/course.model.js';
import Group from '../model/group.model.js';
import Department from '../model/department.model.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// GET /api/evaluations/:evaluationId/results
export const getEvaluationResults = async (req, res) => {
  const { evaluationId } = req.params;

  try {
    const evaluation = await Evaluation.findByPk(evaluationId, {
      include: [
        {
          model: EvaluationSubmission,
          attributes: ['id', 'specialization', 'group_name'],
          include: [
            {
              model: LecturerEvaluation,
              attributes: ['id', 'lecturer_id', 'comment'],
              include: [
                {
                  model: EvaluationResponse,
                  attributes: ['question_id', 'rating'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!evaluation) {
      return res.status(404).json({
        message: 'Evaluation not found',
      });
    }

    // Group by specialization and group
    const groupedData = {};

    evaluation.EvaluationSubmissions?.forEach((submission) => {
      const key = `${submission.specialization || 'Unknown'} Group ${submission.group_name || 'Unknown'}`;

      if (!groupedData[key]) {
        groupedData[key] = {
          specialization: submission.specialization,
          group_name: submission.group_name,
          responses_received: 0,
          total_students: 0,
          lecturer_evaluations: {},
        };
      }

      groupedData[key].responses_received++;

      submission.LecturerEvaluations?.forEach((lecEval) => {
        const lecId = lecEval.lecturer_id;

        if (!groupedData[key].lecturer_evaluations[lecId]) {
          groupedData[key].lecturer_evaluations[lecId] = {
            lecturer_id: lecId,
            question_totals: {},
            comments: [],
          };
        }

        const lecData = groupedData[key].lecturer_evaluations[lecId];

        if (lecEval.comment) {
          lecData.comments.push(lecEval.comment);
        }

        lecEval.EvaluationResponses?.forEach((response) => {
          const qId = response.question_id;
          if (!lecData.question_totals[qId]) {
            lecData.question_totals[qId] = { sum: 0, count: 0 };
          }
          lecData.question_totals[qId].sum += parseFloat(response.rating);
          lecData.question_totals[qId].count++;
        });
      });
    });

    // Fetch course mapping with class and lecturer details
    const courseMapping = await CourseMapping.findByPk(evaluation.course_mapping_id, {
      include: [
        {
          model: ClassModel,
          attributes: ['id', 'name', 'term', 'year_level', 'academic_year'],
          include: [
            {
              model: Specialization,
              attributes: ['id', 'name'],
              include: [
                {
                  model: Department,
                  attributes: ['id', 'dept_name'],
                },
              ],
            },
          ],
        },
        {
          model: Course,
          attributes: ['id', 'course_name'],
        },
        {
          model: LecturerProfile,
          attributes: ['id', 'full_name_english', 'title'],
        },
      ],
    });

    // Fetch all lecturer names for the evaluations
    const lecturerIds = Object.keys(
      Object.values(groupedData).reduce((acc, group) => {
        Object.keys(group.lecturer_evaluations).forEach((id) => (acc[id] = true));
        return acc;
      }, {})
    );

    const lecturers = await LecturerProfile.findAll({
      where: { id: lecturerIds },
      attributes: ['id', 'full_name_english', 'title'],
    });

    const lecturerMap = lecturers.reduce((acc, lec) => {
      acc[lec.id] = {
        name: lec.full_name_english,
        title: lec.title,
      };
      return acc;
    }, {});

    if (courseMapping?.Class) {
      // Collect all unique group names
      const groupNames = Object.values(groupedData)
        .map((g) => g.group_name)
        .filter(Boolean);

      if (groupNames.length > 0) {
        const groups = await Group.findAll({
          where: {
            name: groupNames,
            class_id: courseMapping.Class.id,
          },
          attributes: ['name', 'num_of_student'],
        });

        const groupMap = groups.reduce((acc, group) => {
          acc[group.name] = group.num_of_student;
          return acc;
        }, {});

        // Populate total_students from the map
        Object.values(groupedData).forEach((groupData) => {
          if (groupData.group_name && groupMap[groupData.group_name] !== undefined) {
            groupData.total_students = groupMap[groupData.group_name];
          }
        });
      }
    }

    // Calculate averages and add lecturer names
    Object.values(groupedData).forEach((group) => {
      Object.entries(group.lecturer_evaluations).forEach(([lecId, lecData]) => {
        lecData.question_averages = {};
        let totalAvg = 0;
        let questionCount = 0;

        Object.entries(lecData.question_totals).forEach(([qId, data]) => {
          const avg = data.count > 0 ? (data.sum / data.count).toFixed(1) : 0;
          lecData.question_averages[qId] = parseFloat(avg);
          totalAvg += parseFloat(avg);
          questionCount++;
        });

        // Overall average across all questions for this lecturer
        lecData.overall_average =
          questionCount > 0 ? parseFloat((totalAvg / questionCount).toFixed(1)) : 0;

        // Add lecturer name and title
        if (lecturerMap[lecId]) {
          lecData.lecturer_name = lecturerMap[lecId].name;
          lecData.lecturer_title = lecturerMap[lecId].title;
        }

        // Remove the raw totals (keep only averages)
        delete lecData.question_totals;
      });
    });

    res.status(200).json({
      evaluation_id: evaluation.id,
      course_mapping_id: evaluation.course_mapping_id,
      course_info: {
        course_name: courseMapping?.Course?.course_name,
        class_name: courseMapping?.Class?.name,
        term: courseMapping?.Class?.term,
        year_level: courseMapping?.Class?.year_level,
        academic_year: courseMapping?.Class?.academic_year,
        specialization: courseMapping?.Class?.Specialization?.name,
        department: courseMapping?.Class?.Specialization?.Department?.dept_name,
      },
      total_submissions: evaluation.EvaluationSubmissions?.length || 0,
      groups: groupedData,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Failed to retrieve evaluation results',
      error: err.message,
    });
  }
};

// POST /api/evaluations/upload
export const uploadEvaluation = async (req, res) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded',
        error: 'Please upload an Excel file',
      });
    }

    const transaction = await sequelize.transaction();

    const { lecturer_ids, lecturer_names } = req.body;

    let lecturerIdArray = [];

    // Support both lecturer_names (preferred) and lecturer_ids
    if (lecturer_names) {
      let lecturerNameArray = [];
      try {
        lecturerNameArray = JSON.parse(lecturer_names);
      } catch (e) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Invalid lecturer_names format',
          error: 'lecturer_names must be a JSON array, e.g., ["John Smith", "Jane Doe"]',
        });
      }

      if (lecturerNameArray.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Missing lecturer_names',
          error: 'Please provide lecturer_names array',
        });
      }

      // Find lecturers by name
      const lecturers = await LecturerProfile.findAll({
        where: { full_name_english: lecturerNameArray },
        attributes: ['id', 'full_name_english'],
        transaction,
      });

      if (lecturers.length !== lecturerNameArray.length) {
        const foundNames = lecturers.map((l) => l.full_name_english);
        const missingNames = lecturerNameArray.filter((name) => !foundNames.includes(name));
        await transaction.rollback();
        return res.status(404).json({
          message: 'Lecturer names not found',
          error: `Lecturers not found: ${missingNames.join(', ')}`,
        });
      }

      // Create a map to preserve the order from the request
      const nameToIdMap = lecturers.reduce((acc, lec) => {
        acc[lec.full_name_english] = lec.id;
        return acc;
      }, {});

      // Map names to IDs in the same order as provided
      lecturerIdArray = lecturerNameArray.map((name) => nameToIdMap[name]);
    } else if (lecturer_ids) {
      try {
        lecturerIdArray = JSON.parse(lecturer_ids);
      } catch (e) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Invalid lecturer_ids format',
          error: 'lecturer_ids must be a JSON array, e.g., [1, 2, 3]',
        });
      }

      if (lecturerIdArray.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Missing lecturer_ids',
          error: 'Please provide lecturer_ids array',
        });
      }

      // Validate lecturer_ids exist
      const lecturers = await LecturerProfile.findAll({
        where: { id: lecturerIdArray },
        transaction,
      });

      if (lecturers.length !== lecturerIdArray.length) {
        const foundIds = lecturers.map((l) => l.id);
        const missingIds = lecturerIdArray.filter((id) => !foundIds.includes(id));
        await transaction.rollback();
        return res.status(404).json({
          message: 'Invalid lecturer IDs',
          error: `Lecturer IDs not found: ${missingIds.join(', ')}`,
        });
      }
    } else {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Missing lecturer information',
        error: 'Please provide either lecturer_names or lecturer_ids array',
      });
    }

    // Parse Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const dataRows = rows.slice(1);

    // Extract specialization from first data row Column G (index 6)
    let specializationName = null;
    if (dataRows.length > 0 && dataRows[0][6]) {
      const match = String(dataRows[0][6]).match(/^(.+?)\s+Group\s+(.+)$/i);
      if (match) {
        specializationName = match[1].trim();
      }
    }

    if (!specializationName) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Cannot detect specialization',
        error: 'Column G should contain format: "[Specialization] Group [Name]"',
      });
    }

    // Find specialization in database
    const specialization = await Specialization.findOne({
      where: { name: specializationName },
      transaction,
    });

    if (!specialization) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Specialization not found',
        error: `Specialization "${specializationName}" not found in database`,
      });
    }

    // Auto-detect course_mapping based on lecturer + specialization
    const courseMapping = await CourseMapping.findOne({
      where: {
        lecturer_profile_id: lecturerIdArray[0], // Use first lecturer as primary
      },
      include: [
        {
          model: ClassModel,
          where: { specialization_id: specialization.id },
          required: true,
          attributes: ['id', 'name', 'term', 'year_level', 'academic_year'],
          include: [
            {
              model: Specialization,
              attributes: ['id', 'name'],
              include: [
                {
                  model: Department,
                  attributes: ['id', 'dept_name'],
                },
              ],
            },
          ],
        },
        {
          model: Course,
          attributes: ['id', 'course_name'],
        },
      ],
      order: [
        ['academic_year', 'DESC'],
        ['id', 'DESC'],
      ], // Get most recent
      transaction,
    });

    if (!courseMapping) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Course mapping not found',
        error: `No course mapping found for lecturer ${lecturerIdArray[0]} and specialization "${specializationName}"`,
      });
    }

    const metadataOffset = 7; // Column A-G (metadata)
    const questionsPerLecturer = 5;
    const blockSize = 6; // 5 ratings + 1 comment
    const numLecturers = lecturerIdArray.length;

    // Create evaluation with auto-detected course_mapping
    const evaluation = await Evaluation.create(
      { course_mapping_id: courseMapping.id },
      { transaction }
    );

    // Create lecturer mappings
    const lecturerData = lecturerIdArray.map((lecturer_id, index) => ({
      evaluation_id: evaluation.id,
      lecturer_id: parseInt(lecturer_id),
      order_index: index + 1,
    }));

    await EvaluationLecturer.bulkCreate(lecturerData, { transaction });

    // Import evaluation data
    let submissionCount = 0;
    for (const row of dataRows) {
      // Skip empty rows
      if (!row || row.length === 0) continue;

      // Extract specialization and group from Column G (index 6)
      // Format: "[specialization] Group [group_name]"
      let specialization = null;
      let group_name = null;

      const columnG = row[6];
      if (columnG) {
        const match = String(columnG).match(/^(.+?)\s+Group\s+(.+)$/i);
        if (match) {
          specialization = match[1].trim();
          group_name = match[2].trim();
        }
      }

      // Create submission
      const submission = await EvaluationSubmission.create(
        {
          evaluation_id: evaluation.id,
          specialization,
          group_name,
        },
        { transaction }
      );

      // Process each lecturer
      for (let i = 0; i < numLecturers; i++) {
        const baseIndex = metadataOffset + i * blockSize;
        const commentValue = row[baseIndex + 5];
        const comment = commentValue ? String(commentValue).trim() : '';

        const lecturerEval = await LecturerEvaluation.create(
          {
            submission_id: submission.id,
            lecturer_id: lecturerIdArray[i],
            comment: comment,
          },
          { transaction }
        );

        // Insert 5 ratings for this lecturer
        for (let q = 0; q < questionsPerLecturer; q++) {
          const rating = row[baseIndex + q];

          if (rating == null || rating === '') continue;

          await EvaluationResponse.create(
            {
              lecturer_evaluation_id: lecturerEval.id,
              question_id: q + 1,
              rating: parseFloat(rating),
            },
            { transaction }
          );
        }
      }
      submissionCount++;
    }

    await transaction.commit();
    res.status(201).json({
      message: 'Evaluation uploaded successfully',
      evaluation_id: evaluation.id,
      course_mapping_id: evaluation.course_mapping_id,
      course_info: {
        course_name: courseMapping?.Course?.course_name,
        class_name: courseMapping?.Class?.name,
        term: courseMapping?.Class?.term,
        year_level: courseMapping?.Class?.year_level,
        academic_year: courseMapping?.Class?.academic_year,
        specialization: courseMapping?.Class?.Specialization?.name,
        department: courseMapping?.Class?.Specialization?.Department?.dept_name,
      },
      stats: {
        total_submissions: submissionCount,
        lecturers: numLecturers,
      },
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Evaluation upload error:', err);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  }
};

// GET /api/evaluations/:evaluationId/lecturer/:lecturerId/pdf
export const getLecturerEvaluationPDF = async (req, res) => {
  let browser;
  const { evaluationId, lecturerId } = req.params;

  try {
    // Fetch evaluation with all data for this lecturer
    const evaluation = await Evaluation.findByPk(evaluationId, {
      include: [
        {
          model: EvaluationSubmission,
          attributes: ['id', 'specialization', 'group_name'],
          include: [
            {
              model: LecturerEvaluation,
              where: { lecturer_id: lecturerId },
              required: false,
              attributes: ['id', 'lecturer_id', 'comment'],
              include: [
                {
                  model: EvaluationResponse,
                  attributes: ['question_id', 'rating'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!evaluation) {
      return res.status(404).json({
        message: 'Evaluation not found',
      });
    }

    // Get lecturer details
    const lecturer = await LecturerProfile.findByPk(lecturerId, {
      attributes: ['id', 'full_name_english', 'title'],
    });

    if (!lecturer) {
      return res.status(404).json({
        message: 'Lecturer not found',
      });
    }

    // Get course mapping details
    const courseMapping = await CourseMapping.findByPk(evaluation.course_mapping_id, {
      include: [
        {
          model: ClassModel,
          attributes: ['id', 'name', 'term', 'year_level', 'academic_year'],
          include: [
            {
              model: Specialization,
              attributes: ['id', 'name'],
              include: [
                {
                  model: Department,
                  attributes: ['id', 'dept_name'],
                },
              ],
            },
          ],
        },
        {
          model: Course,
          attributes: ['id', 'course_name'],
        },
      ],
    });

    // Process data for this lecturer
    const questionTotals = {};
    const allComments = [];
    let totalResponseCount = 0;
    let totalStudents = 0;

    evaluation.EvaluationSubmissions?.forEach((submission) => {
      if (!submission.LecturerEvaluations || submission.LecturerEvaluations.length === 0) {
        return; // Skip if no evaluation for this lecturer
      }

      const lecEval = submission.LecturerEvaluations[0];
      totalResponseCount++;

      if (lecEval.comment && lecEval.comment.trim()) {
        allComments.push(lecEval.comment.trim());
      }

      lecEval.EvaluationResponses?.forEach((response) => {
        const qId = response.question_id;
        if (!questionTotals[qId]) {
          questionTotals[qId] = { sum: 0, count: 0 };
        }
        questionTotals[qId].sum += parseFloat(response.rating);
        questionTotals[qId].count++;
      });
    });

    // Get total students from groups
    if (courseMapping?.Class) {
      const groups = await Group.findAll({
        where: { class_id: courseMapping.Class.id },
        attributes: ['num_of_student'],
      });
      totalStudents = groups.reduce((sum, g) => sum + (g.num_of_student || 0), 0);
    }

    // Calculate question averages
    const questionAverages = {};
    let overallSum = 0;
    let questionCount = 0;

    Object.entries(questionTotals).forEach(([qId, data]) => {
      const avg = data.count > 0 ? data.sum / data.count : 0;
      questionAverages[qId] = avg.toFixed(1);
      overallSum += avg;
      questionCount++;
    });

    const overallAverage = questionCount > 0 ? (overallSum / questionCount).toFixed(1) : '0.0';
    const responsePercentage =
      totalStudents > 0 ? Math.round((totalResponseCount / totalStudents) * 100) : 100;

    // Load questions from database
    const questions = await EvaluationQuestion.findAll({
      order: [['order_no', 'ASC']],
      attributes: ['id', 'question_text', 'order_no'],
    });

    // Read HTML template
    const htmlPath = path.join(process.cwd(), 'src', 'utils', 'evaluation.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Prepare replacement values with HTML escaping
    const escapeHtml = (text) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const lecturerTitle = lecturer.title ? escapeHtml(lecturer.title) + '.' : '';
    const lecturerFullName = escapeHtml(lecturer.full_name_english || 'N/A');
    const courseName = escapeHtml(courseMapping?.Course?.course_name || 'N/A');
    const className = escapeHtml(courseMapping?.Class?.name || '10');
    const yearLevel = escapeHtml(courseMapping?.Class?.year_level || 'Year 2');
    const term = escapeHtml(courseMapping?.Class?.term || 'Term 2');

    // Replace all placeholders
    html = html.replace(/{lecturer_title}/g, lecturerTitle);
    html = html.replace(/{lecturer_name}/g, lecturerFullName);
    html = html.replace(/{course_name}/g, courseName);
    html = html.replace(/{class_name}/g, className);
    html = html.replace(/{year_level}/g, yearLevel);
    html = html.replace(/{term}/g, term);
    html = html.replace(/{responses_received}/g, totalResponseCount.toString());
    html = html.replace(/{total_students}/g, totalStudents.toString());
    html = html.replace(/{response_percentage}/g, responsePercentage.toString());

    // Generate evaluation table rows dynamically from database questions
    let evaluationTableRows = '';
    questions.forEach((question) => {
      const qId = question.id;
      const rating = questionAverages[qId] || '0.0';
      const questionText = escapeHtml(question.question_text);
      const questionNumber = question.order_no;

      evaluationTableRows += `      <tr>
        <td>Q${questionNumber}. ${questionText}</td>
        <td class="score">${rating}</td>
      </tr>\n`;
    });

    // Add average row
    evaluationTableRows += `      <tr class="avg-row">
        <td class="avg-label"><strong>Average of Q1 to Q${questions.length}</strong></td>
        <td class="score avg-score">${overallAverage}</td>
      </tr>`;

    // Replace the evaluation table rows placeholder
    html = html.replace(/{evaluationTableRows}/g, evaluationTableRows);

    // Replace comments - generate dynamic HTML for tbody
    let commentTableRows = '';
    if (allComments.length > 0) {
      commentTableRows = allComments
        .map((comment, index) => {
          const safeComment = escapeHtml(comment);
          return `          <tr>
            <td>${index + 1}.&nbsp;&nbsp; ${safeComment}</td>
          </tr>`;
        })
        .join('\n');
    } else {
      commentTableRows = `          <tr>
            <td>No comments provided.</td>
          </tr>`;
    }

    // Replace the comment table rows placeholder
    html = html.replace(/{commentTableRows}/g, commentTableRows);

    // Handle logo path - convert to base64 for embedding
    const logoPath = path.join(process.cwd(), 'src', 'utils', 'idt-logo-blue.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      html = html.replace(/src="idt-logo-blue\.png"/g, `src="data:image/png;base64,${logoBase64}"`);
    }

    // Launch browser and generate PDF
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        left: '15mm',
      },
    });
    res.setHeader('Content-Type', 'application/pdf');
    //res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (err) {
    return res.status(500).json({
      message: 'Failed to generate PDF',
      error: err.message,
    });
  } finally {
    if (browser) await browser.close();
  }
};
