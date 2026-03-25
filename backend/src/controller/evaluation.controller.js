import sequelize from '../config/db.js';
import { Op } from 'sequelize';
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
import User from '../model/user.model.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { calculateLecturerAverages } from '../utils/evaluationUtils.js';
import { getNotificationSocket } from '../socket/index.js';

const roundToOne = (value) => Math.round((Number(value) + Number.EPSILON) * 10) / 10;

const SPECIALIZATION_ALIAS_TO_NAME = {
  se: 'Software Engineering',
  'software engineering': 'Software Engineering',
  ds: 'Data Science',
  'data science': 'Data Science',
  cs: 'Cyber Security',
  'cyber security': 'Cyber Security',
  cybersecurity: 'Cyber Security',
  tn: 'Telecommunications and Network',
  tne: 'Telecommunications and Network',
  'telecommunications and network': 'Telecommunications and Network',
  'telecom and networking engineering': 'Telecommunications and Network',
  ecom: 'E-commerce',
  ecommerce: 'E-commerce',
  'e-commerce': 'E-commerce',
  db: 'E-commerce',
  'digital business': 'E-commerce',
};

function canonicalizeEvaluationSpecializationName(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const normalized = raw
    .replace(/\s*\([^)]+\)\s*$/u, '')
    .trim()
    .toLowerCase();

  return SPECIALIZATION_ALIAS_TO_NAME[normalized] || raw;
}

function parseEvaluationGroupCell(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) {
    return {
      specializationName: null,
      groupName: null,
    };
  }

  const canonicalMatch = raw.match(/^(.+?)\s+Group\s+(.+)$/i);
  if (canonicalMatch) {
    const specializationName = canonicalizeEvaluationSpecializationName(canonicalMatch[1]);
    const groupName = String(canonicalMatch[2] || '').trim() || null;

    return {
      specializationName,
      groupName,
    };
  }

  const compactMatch = raw.match(/^([A-Za-z][A-Za-z\s&()/]+?)\s*-\s*([A-Za-z0-9][A-Za-z0-9-]*)$/);
  if (compactMatch) {
    const specializationName = canonicalizeEvaluationSpecializationName(compactMatch[1]);
    const groupName = String(compactMatch[2] || '').trim() || null;

    return {
      specializationName,
      groupName,
    };
  }

  return {
    specializationName: null,
    groupName: null,
  };
}

function normalizeEvaluationGroupLookupValue(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function getComparableEvaluationGroupToken(value) {
  const normalized = normalizeEvaluationGroupLookupValue(value);
  if (!normalized) return '';

  const suffixMatch = normalized.match(/(?:^|[-_/])(G\d+[A-Z0-9-]*)$/);
  if (suffixMatch) {
    return suffixMatch[1];
  }

  if (/^\d+[A-Z0-9-]*$/u.test(normalized) && !normalized.startsWith('G')) {
    return `G${normalized}`;
  }

  return normalized;
}

function buildEvaluationGroupLookup(groupNames) {
  const byNormalized = new Map();
  const byComparable = new Map();

  (Array.isArray(groupNames) ? groupNames : []).forEach((groupName) => {
    const raw = String(groupName || '').trim();
    if (!raw) return;

    const normalized = normalizeEvaluationGroupLookupValue(raw);
    const comparable = getComparableEvaluationGroupToken(raw);

    if (normalized && !byNormalized.has(normalized)) {
      byNormalized.set(normalized, raw);
    }

    if (comparable && !byComparable.has(comparable)) {
      byComparable.set(comparable, raw);
    }
  });

  return { byNormalized, byComparable };
}

function resolveEvaluationGroupName(rawValue, lookup) {
  const raw = String(rawValue || '').trim();
  if (!raw) return null;

  const normalized = normalizeEvaluationGroupLookupValue(raw);
  if (lookup?.byNormalized?.has(normalized)) {
    return lookup.byNormalized.get(normalized);
  }

  const comparable = getComparableEvaluationGroupToken(raw);
  if (lookup?.byComparable?.has(comparable)) {
    return lookup.byComparable.get(comparable);
  }

  if (/^\d+$/u.test(raw) && lookup?.byComparable?.has(`G${raw}`)) {
    return lookup.byComparable.get(`G${raw}`);
  }

  return raw;
}

function resolveEvaluationUploadGroups(parsedRows, assignments, classGroupNames) {
  const classGroupLookup = buildEvaluationGroupLookup(classGroupNames);

  const normalizedParsedRows = parsedRows.map((item) => ({
    ...item,
    groupName:
      resolveEvaluationGroupName(item.rawGroupName, classGroupLookup) || item.rawGroupName,
  }));

  const fileGroupNames = Array.from(
    new Set(normalizedParsedRows.map((item) => String(item.groupName || '').trim()).filter(Boolean))
  );
  const fileGroupLookup = buildEvaluationGroupLookup(fileGroupNames);

  const resolvedAssignments = assignments.map((assignment) => {
    const resolvedGroupNames =
      assignment.group_names.length > 0
        ? Array.from(
            new Set(
              assignment.group_names
                .map((groupName) => resolveEvaluationGroupName(groupName, classGroupLookup))
                .filter(Boolean)
            )
          )
        : [...fileGroupNames];

    return {
      ...assignment,
      group_names: resolvedGroupNames,
    };
  });

  return {
    normalizedParsedRows,
    fileGroupNames,
    fileGroupLookup,
    resolvedAssignments,
  };
}

function getEvaluationScopeDetails(courseMapping) {
  return {
    classId: Number(courseMapping?.class_id || courseMapping?.Class?.id || 0) || null,
    className: String(courseMapping?.Class?.name || '').trim() || null,
    academicYear:
      String(courseMapping?.academic_year || courseMapping?.Class?.academic_year || '').trim() ||
      null,
    term: String(courseMapping?.term || courseMapping?.Class?.term || '').trim() || null,
    yearLevel: String(courseMapping?.Class?.year_level || '').trim() || null,
    specialization: String(courseMapping?.Class?.Specialization?.name || '').trim() || null,
    department: String(courseMapping?.Class?.Specialization?.Department?.dept_name || '').trim() || null,
    departmentKhmer:
      String(courseMapping?.Class?.Specialization?.Department?.dept_name_khmer || '').trim() || null,
  };
}

function resolveEvaluationCourseOption(options, fallbackCourseName = '-') {
  const uniqueOptions = Array.from(
    new Map(
      (Array.isArray(options) ? options : [])
        .filter((option) => option?.courseName || option?.courseId)
        .map((option) => {
          const key = `${option.courseId || 'unknown'}|${option.courseName || ''}`;
          return [key, option];
        })
    ).values()
  );

  if (uniqueOptions.length === 1) {
    return uniqueOptions[0];
  }

  if (uniqueOptions.length > 1) {
    return {
      mappingId: null,
      courseId: null,
      courseName: 'Multiple Courses',
    };
  }

  return {
    mappingId: null,
    courseId: null,
    courseName: fallbackCourseName || '-',
  };
}

async function loadEvaluationCourseMappingLookup(
  { classId, academicYear, term, lecturerIds, groupNames },
  transaction
) {
  const numericLecturerIds = Array.from(
    new Set(
      (Array.isArray(lecturerIds) ? lecturerIds : [])
        .map((lecturerId) => Number(lecturerId))
        .filter((lecturerId) => Number.isInteger(lecturerId) && lecturerId > 0)
    )
  );

  const normalizedGroupKeys = new Set(
    (Array.isArray(groupNames) ? groupNames : [])
      .map((groupName) => normalizeEvaluationGroupLookupValue(groupName))
      .filter(Boolean)
  );

  if (!classId || !academicYear || !term || numericLecturerIds.length === 0) {
    return {
      mappings: [],
      byLecturerGroup: new Map(),
    };
  }

  const mappings = await CourseMapping.findAll({
    where: {
      lecturer_profile_id: numericLecturerIds,
      class_id: classId,
      academic_year: academicYear,
      term,
    },
    include: [
      {
        model: Group,
        attributes: ['id', 'name', 'class_id'],
        required: false,
      },
      {
        model: Course,
        attributes: ['id', 'course_name'],
        required: false,
      },
    ],
    attributes: ['id', 'lecturer_profile_id', 'group_id', 'class_id', 'course_id', 'term', 'academic_year'],
    transaction,
  });

  const byLecturerGroup = new Map();

  mappings.forEach((mapping) => {
    const lecturerId = Number(mapping?.lecturer_profile_id);
    const groupName = String(mapping?.Group?.name || '').trim();
    if (!Number.isInteger(lecturerId) || lecturerId <= 0 || !groupName) {
      return;
    }

    const normalizedGroupKey = normalizeEvaluationGroupLookupValue(groupName);
    if (normalizedGroupKeys.size > 0 && !normalizedGroupKeys.has(normalizedGroupKey)) {
      return;
    }

    const key = `${lecturerId}|${normalizedGroupKey}`;
    const nextOption = {
      mappingId: Number(mapping?.id || 0) || null,
      courseId: Number(mapping?.course_id || 0) || null,
      courseName:
        String(mapping?.Course?.course_name || '').trim() ||
        (mapping?.course_id ? `Course ${mapping.course_id}` : '-'),
    };

    if (!byLecturerGroup.has(key)) {
      byLecturerGroup.set(key, [nextOption]);
      return;
    }

    byLecturerGroup.set(key, [...byLecturerGroup.get(key), nextOption]);
  });

  return {
    mappings,
    byLecturerGroup,
  };
}

// GET /api/evaluations/summary/list
export const getEvaluationSummary = async (_req, res) => {
  try {
    const evaluations = await Evaluation.findAll({
      include: [
        {
          model: CourseMapping,
          attributes: ['id', 'class_id', 'academic_year', 'term'],
          include: [
            {
              model: ClassModel,
              attributes: ['id', 'name', 'term', 'year_level', 'academic_year'],
            },
            {
              model: Course,
              attributes: ['course_name'],
            },
          ],
        },
        {
          model: EvaluationSubmission,
          attributes: ['group_name'],
          include: [
            {
              model: LecturerEvaluation,
              attributes: ['lecturer_id'],
              include: [
                {
                  model: EvaluationResponse,
                  attributes: ['rating'],
                },
              ],
            },
          ],
        },
      ],
      order: [['id', 'DESC']],
    });

    const lecturerIdSet = new Set();
    evaluations.forEach((evaluation) => {
      evaluation.EvaluationSubmissions?.forEach((submission) => {
        submission.LecturerEvaluations?.forEach((lecturerEvaluation) => {
          if (lecturerEvaluation?.lecturer_id) {
            lecturerIdSet.add(lecturerEvaluation.lecturer_id);
          }
        });
      });
    });

    const lecturerIds = Array.from(lecturerIdSet);
    const lecturers = lecturerIds.length
      ? await LecturerProfile.findAll({
          where: { id: lecturerIds },
          attributes: ['id', 'full_name_english', 'title', 'user_id'],
        })
      : [];

    const userIds = lecturers
      .map((lecturer) => lecturer.user_id)
      .filter((id) => Number.isInteger(id));

    const users = userIds.length
      ? await User.findAll({
          where: { id: userIds },
          attributes: ['id', 'email'],
        })
      : [];

    const userEmailMap = users.reduce((acc, user) => {
      acc[user.id] = user.email || '';
      return acc;
    }, {});

    const lecturerMap = lecturers.reduce((acc, lecturer) => {
      const name = lecturer.full_name_english || '';
      const title = lecturer.title ? `${lecturer.title} ` : '';
      acc[lecturer.id] = {
        name: `${title}${name}`.trim() || `Lecturer ${lecturer.id}`,
        email: lecturer.user_id ? userEmailMap[lecturer.user_id] || '' : '',
      };
      return acc;
    }, {});

    const summaryRows = [];
    const seenKey = new Set();

    for (const evaluation of evaluations) {
      const scope = getEvaluationScopeDetails(evaluation?.CourseMapping);
      const term = scope.term || '-';
      const academicYear = scope.academicYear || '-';
      const courseMappingId = evaluation?.course_mapping_id || null;

      const lecturerIdsInEvaluation = Array.from(
        new Set(
          evaluation.EvaluationSubmissions?.flatMap((submission) =>
            submission.LecturerEvaluations?.map((lecturerEvaluation) => lecturerEvaluation?.lecturer_id) || []
          ).filter((lecturerId) => Number.isInteger(lecturerId)) || []
        )
      );

      const groupNamesInEvaluation = Array.from(
        new Set(
          evaluation.EvaluationSubmissions?.map((submission) => String(submission?.group_name || '').trim())
            .filter(Boolean) || []
        )
      );

      const { byLecturerGroup } = await loadEvaluationCourseMappingLookup(
        {
          classId: scope.classId,
          academicYear: scope.academicYear,
          term: scope.term,
          lecturerIds: lecturerIdsInEvaluation,
          groupNames: groupNamesInEvaluation,
        }
      );

      const byLecturerCourse = new Map();

      evaluation.EvaluationSubmissions?.forEach((submission) => {
        const groupName = String(submission?.group_name || 'N/A').trim() || 'N/A';
        const groupLookupKey = normalizeEvaluationGroupLookupValue(groupName);

        submission.LecturerEvaluations?.forEach((lecturerEvaluation) => {
          const lecturerId = lecturerEvaluation?.lecturer_id;
          if (!lecturerId) return;

          const resolvedCourse = resolveEvaluationCourseOption(
            byLecturerGroup.get(`${lecturerId}|${groupLookupKey}`),
            evaluation?.CourseMapping?.Course?.course_name || '-'
          );
          const bucketKey = `${lecturerId}|${resolvedCourse.courseId || resolvedCourse.courseName}`;

          if (!byLecturerCourse.has(bucketKey)) {
            byLecturerCourse.set(bucketKey, {
              lecturerId,
              courseName: resolvedCourse.courseName,
              courseMappingId: resolvedCourse.mappingId || courseMappingId,
              groupStats: {},
            });
          }

          const lecturerData = byLecturerCourse.get(bucketKey);
          if (!lecturerData.groupStats[groupName]) {
            lecturerData.groupStats[groupName] = { sum: 0, count: 0 };
          }

          lecturerEvaluation.EvaluationResponses?.forEach((response) => {
            const rating = Number(response?.rating);
            if (!Number.isFinite(rating)) return;
            lecturerData.groupStats[groupName].sum += rating;
            lecturerData.groupStats[groupName].count += 1;
          });
        });
      });

      byLecturerCourse.forEach((lecturerData) => {
        const uniqueKey = `${lecturerData.lecturerId}|${academicYear}|${term}|${lecturerData.courseName}`;
        if (seenKey.has(uniqueKey)) return;

        const groupScores = Object.entries(lecturerData.groupStats)
          .map(([group_name, stat]) => {
            if (!stat.count) return null;
            const score = roundToOne(stat.sum / stat.count);
            return { group_name, score };
          })
          .filter(Boolean)
          .sort((a, b) => a.group_name.localeCompare(b.group_name));

        const totalPoint = groupScores.length
          ? roundToOne(
              groupScores.reduce((acc, group) => acc + group.score, 0) / groupScores.length
            )
          : 0;

        summaryRows.push({
          evaluation_id: evaluation.id,
          course_mapping_id: lecturerData.courseMappingId,
          lecturer_id: lecturerData.lecturerId,
          lecturer_name:
            lecturerMap[lecturerData.lecturerId]?.name || `Lecturer ${lecturerData.lecturerId}`,
          lecturer_email: lecturerMap[lecturerData.lecturerId]?.email || '',
          academic_year: academicYear,
          term,
          course_name: lecturerData.courseName,
          group_scores: groupScores,
          total_point: totalPoint,
          max_score: 5,
        });

        seenKey.add(uniqueKey);
      });
    }

    return res.status(200).json({
      data: summaryRows,
      total: summaryRows.length,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Failed to load evaluation summary',
      error: err.message,
    });
  }
};

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
            evaluations: [], // Store evaluations for later calculation
          };
        }

        // Collect evaluations for this lecturer
        groupedData[key].lecturer_evaluations[lecId].evaluations.push(lecEval);
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

    const scope = getEvaluationScopeDetails(courseMapping);
    const lecturerIdsInEvaluation = lecturerIds.map((id) => Number(id)).filter((id) => Number.isInteger(id));
    const groupNamesInEvaluation = Object.values(groupedData)
      .map((group) => String(group?.group_name || '').trim())
      .filter(Boolean);
    const { byLecturerGroup } = await loadEvaluationCourseMappingLookup(
      {
        classId: scope.classId,
        academicYear: scope.academicYear,
        term: scope.term,
        lecturerIds: lecturerIdsInEvaluation,
        groupNames: groupNamesInEvaluation,
      }
    );
    const resolvedCourseNames = new Set();

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

    // Calculate averages and add lecturer names using utility function
    Object.values(groupedData).forEach((group) => {
      Object.entries(group.lecturer_evaluations).forEach(([lecId, lecData]) => {
        // Use utility function to calculate averages
        const calculatedData = calculateLecturerAverages(lecData.evaluations);

        lecData.question_averages = calculatedData.questionAverages;
        lecData.overall_average = calculatedData.overallAverage;
        lecData.comments = calculatedData.comments;

        // Add lecturer name and title
        if (lecturerMap[lecId]) {
          lecData.lecturer_name = lecturerMap[lecId].name;
          lecData.lecturer_title = lecturerMap[lecId].title;
        }

        const resolvedCourse = resolveEvaluationCourseOption(
          byLecturerGroup.get(
            `${Number(lecId)}|${normalizeEvaluationGroupLookupValue(group.group_name)}`
          ),
          courseMapping?.Course?.course_name || '-'
        );
        lecData.course_name = resolvedCourse.courseName;
        if (resolvedCourse.courseName && resolvedCourse.courseName !== '-') {
          resolvedCourseNames.add(resolvedCourse.courseName);
        }

        // Remove the temporary evaluations array
        delete lecData.evaluations;
      });
    });

    const resolvedCourseNameList = Array.from(resolvedCourseNames);
    const resolvedCourseLabel =
      resolvedCourseNameList.length === 1
        ? resolvedCourseNameList[0]
        : resolvedCourseNameList.length > 1
          ? 'Multiple Courses'
          : courseMapping?.Course?.course_name;

    const questionCatalog = await EvaluationQuestion.findAll({
      order: [['order_no', 'ASC']],
      attributes: ['id', 'question_text', 'order_no'],
    });

    res.status(200).json({
      evaluation_id: evaluation.id,
      course_mapping_id: evaluation.course_mapping_id,
      course_info: {
        course_name: resolvedCourseLabel,
        course_names: resolvedCourseNameList,
        class_name: courseMapping?.Class?.name,
        term: courseMapping?.Class?.term,
        year_level: courseMapping?.Class?.year_level,
        academic_year: courseMapping?.Class?.academic_year,
        specialization: courseMapping?.Class?.Specialization?.name,
        department: courseMapping?.Class?.Specialization?.Department?.dept_name,
      },
      total_submissions: evaluation.EvaluationSubmissions?.length || 0,
      groups: groupedData,
      question_catalog: questionCatalog,
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
  let transaction;

  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded',
        error: 'Please upload an Excel file',
      });
    }

    // Parse Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const dataRows = rows.slice(1);

    const parsedRows = dataRows
      .map((row) => {
        const parsedGroupCell = parseEvaluationGroupCell(row?.[6]);
        return {
          row,
          specializationName: parsedGroupCell.specializationName,
          rawGroupName: parsedGroupCell.groupName,
        };
      })
      .filter((item) => item.rawGroupName);

    if (parsedRows.length === 0) {
      return res.status(400).json({
        message: 'No evaluation groups detected',
        error:
          'Column G should contain one group per row in format "[Specialization] Group [Name]" or a compact value like "SE-G1"',
      });
    }

    // Extract specialization from first data row Column G (index 6).
    const specializationName = parsedRows[0]?.specializationName;

    if (!specializationName) {
      return res.status(400).json({
        message: 'Cannot detect specialization',
        error:
          'Column G should contain format: "[Specialization] Group [Name]" or an abbreviation like "SE-G1"',
      });
    }

    transaction = await sequelize.transaction();

    const {
      lecturer_ids,
      lecturer_names,
      lecturer_assignments,
      course_mapping_id,
      academic_year,
      class_id,
      term,
    } = req.body;

    let requestedAssignments = [];

    if (lecturer_assignments) {
      try {
        requestedAssignments = JSON.parse(lecturer_assignments);
      } catch (e) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Invalid lecturer_assignments format',
          error:
            'lecturer_assignments must be a JSON array containing lecturer_id or lecturer_name, order_index, and group_names',
        });
      }

      if (!Array.isArray(requestedAssignments) || requestedAssignments.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Missing lecturer assignments',
          error: 'Please provide at least one lecturer assignment',
        });
      }
    } else if (lecturer_names || lecturer_ids) {
      let lecturerIdArray = [];
      let lecturerNameArray = [];

      if (lecturer_names) {
        try {
          lecturerNameArray = JSON.parse(lecturer_names);
        } catch (e) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Invalid lecturer_names format',
            error: 'lecturer_names must be a JSON array, e.g., ["John Smith", "Jane Doe"]',
          });
        }

        if (!Array.isArray(lecturerNameArray) || lecturerNameArray.length === 0) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Missing lecturer_names',
            error: 'Please provide lecturer_names array',
          });
        }

        requestedAssignments = lecturerNameArray.map((name, index) => ({
          lecturer_name: String(name || '').trim(),
          order_index: index + 1,
          group_names: [],
        }));
      } else {
        try {
          lecturerIdArray = JSON.parse(lecturer_ids);
        } catch (e) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Invalid lecturer_ids format',
            error: 'lecturer_ids must be a JSON array, e.g., [1, 2, 3]',
          });
        }

        if (!Array.isArray(lecturerIdArray) || lecturerIdArray.length === 0) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Missing lecturer_ids',
            error: 'Please provide lecturer_ids array',
          });
        }

        requestedAssignments = lecturerIdArray.map((lecturerId, index) => ({
          lecturer_id: lecturerId,
          order_index: index + 1,
          group_names: [],
        }));
      }
    } else {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Missing lecturer information',
        error:
          'Please provide lecturer_assignments, or use the legacy lecturer_names or lecturer_ids array',
      });
    }

    const normalizedAssignments = requestedAssignments
      .map((assignment, index) => {
        const lecturerId = parseInt(String(assignment?.lecturer_id || ''), 10);
        const lecturerName = String(assignment?.lecturer_name || '').trim();
        const orderIndex = parseInt(String(assignment?.order_index || index + 1), 10);
        const groupNames = Array.isArray(assignment?.group_names)
          ? assignment.group_names.map((groupName) => String(groupName || '').trim()).filter(Boolean)
          : [];

        return {
          lecturer_id: Number.isInteger(lecturerId) && lecturerId > 0 ? lecturerId : null,
          lecturer_name: lecturerName,
          order_index: Number.isInteger(orderIndex) && orderIndex > 0 ? orderIndex : index + 1,
          group_names: groupNames,
        };
      })
      .sort((a, b) => a.order_index - b.order_index);

    if (normalizedAssignments.some((assignment) => !assignment.lecturer_id && !assignment.lecturer_name)) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Invalid lecturer assignments',
        error: 'Each lecturer assignment must include lecturer_id or lecturer_name',
      });
    }

    const duplicateOrderIndexes = normalizedAssignments
      .map((assignment) => assignment.order_index)
      .filter((orderIndex, index, all) => all.indexOf(orderIndex) !== index);
    if (duplicateOrderIndexes.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Duplicate lecturer order',
        error: `Duplicate order_index values: ${Array.from(new Set(duplicateOrderIndexes)).join(', ')}`,
      });
    }

    const assignmentLecturerIds = normalizedAssignments
      .map((assignment) => assignment.lecturer_id)
      .filter((lecturerId) => Number.isInteger(lecturerId));
    const assignmentLecturerNames = normalizedAssignments
      .map((assignment) => assignment.lecturer_name)
      .filter(Boolean);

    const lecturerLookupConditions = [];
    if (assignmentLecturerIds.length > 0) {
      lecturerLookupConditions.push({ id: assignmentLecturerIds });
    }
    if (assignmentLecturerNames.length > 0) {
      lecturerLookupConditions.push({ full_name_english: assignmentLecturerNames });
    }

    const lecturers = await LecturerProfile.findAll({
      where:
        lecturerLookupConditions.length > 1
          ? { [Op.or]: lecturerLookupConditions }
          : lecturerLookupConditions[0],
      attributes: ['id', 'full_name_english'],
      transaction,
    });

    const lecturerById = new Map(lecturers.map((lecturer) => [lecturer.id, lecturer]));
    const lecturerByName = new Map(
      lecturers.map((lecturer) => [String(lecturer.full_name_english || '').trim(), lecturer])
    );

    for (const assignment of normalizedAssignments) {
      let lecturer = null;

      if (assignment.lecturer_id) {
        lecturer = lecturerById.get(assignment.lecturer_id) || null;
      }

      if (!lecturer && assignment.lecturer_name) {
        lecturer = lecturerByName.get(assignment.lecturer_name) || null;
      }

      if (!lecturer) {
        await transaction.rollback();
        return res.status(404).json({
          message: 'Lecturer not found',
          error: assignment.lecturer_name
            ? `Lecturer "${assignment.lecturer_name}" not found`
            : `Lecturer ID ${assignment.lecturer_id} not found`,
        });
      }

      assignment.lecturer_id = lecturer.id;
      assignment.lecturer_name = lecturer.full_name_english || `Lecturer ${lecturer.id}`;
    }

    const duplicateLecturerIds = normalizedAssignments
      .map((assignment) => assignment.lecturer_id)
      .filter((lecturerId, index, all) => all.indexOf(lecturerId) !== index);
    if (duplicateLecturerIds.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Duplicate lecturers in upload order',
        error: `Each lecturer can only appear once in lecturer_assignments. Duplicate lecturer IDs: ${Array.from(new Set(duplicateLecturerIds)).join(', ')}`,
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

    const selectedClassId = parseInt(String(class_id || ''), 10);
    const selectedAcademicYear = String(academic_year || '').trim();
    const selectedTerm = String(term || '').trim();

    let selectedClass = null;
    if (Number.isInteger(selectedClassId) && selectedClassId > 0) {
      selectedClass = await ClassModel.findByPk(selectedClassId, {
        attributes: ['id', 'name', 'term', 'year_level', 'academic_year', 'specialization_id'],
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
        transaction,
      });

      if (!selectedClass) {
        await transaction.rollback();
        return res.status(404).json({
          message: 'Class not found',
          error: `Class ID ${selectedClassId} not found`,
        });
      }

      if (selectedClass.specialization_id !== specialization.id) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Specialization mismatch',
          error: 'The uploaded file specialization does not match the selected class specialization',
        });
      }
    }

    let courseMapping = null;

    if (course_mapping_id) {
      const courseMappingId = parseInt(String(course_mapping_id || ''), 10);
      if (!Number.isInteger(courseMappingId) || courseMappingId <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Invalid course_mapping_id',
          error: 'course_mapping_id must be a positive integer',
        });
      }

      courseMapping = await CourseMapping.findByPk(courseMappingId, {
        include: [
          {
            model: ClassModel,
            attributes: ['id', 'name', 'term', 'year_level', 'academic_year', 'specialization_id'],
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
        transaction,
      });

      if (selectedClass && Number(courseMapping?.class_id) !== Number(selectedClass.id)) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Class mismatch',
          error: 'The selected class does not match the resolved course mapping class',
        });
      }
    }

    if (!courseMapping) {
      if (selectedClass && selectedAcademicYear && selectedTerm) {
        const selectedClassGroups = await Group.findAll({
          where: { class_id: selectedClass.id },
          attributes: ['id', 'name'],
          transaction,
        });

        const {
          normalizedParsedRows,
          fileGroupNames,
          fileGroupLookup,
          resolvedAssignments,
        } = resolveEvaluationUploadGroups(
          parsedRows,
          normalizedAssignments,
          selectedClassGroups.map((group) => group.name).filter(Boolean)
        );

        const unknownAssignedGroups = resolvedAssignments.flatMap((assignment) =>
          assignment.group_names.filter(
            (groupName) =>
              !fileGroupLookup.byNormalized.has(normalizeEvaluationGroupLookupValue(groupName))
          )
        );

        if (unknownAssignedGroups.length > 0) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Assigned groups not found in file',
            error: `These assigned groups do not appear in the uploaded file: ${Array.from(new Set(unknownAssignedGroups)).join(', ')}`,
          });
        }

        const candidateMappings = await CourseMapping.findAll({
          where: {
            lecturer_profile_id: resolvedAssignments.map((assignment) => assignment.lecturer_id),
            class_id: selectedClass.id,
            academic_year: selectedAcademicYear,
            term: selectedTerm,
          },
          include: [
            {
              model: Group,
              attributes: ['id', 'name', 'class_id'],
              required: false,
            },
            {
              model: ClassModel,
              attributes: ['id', 'name', 'term', 'year_level', 'academic_year', 'specialization_id'],
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
          attributes: ['id', 'lecturer_profile_id', 'group_id', 'class_id', 'course_id', 'term', 'academic_year'],
          order: [['id', 'DESC']],
          transaction,
        });

        const hasMissingAssignmentMapping = resolvedAssignments.some((assignment) => {
          const matchingMappings = candidateMappings
            .filter((mapping) => Number(mapping.lecturer_profile_id) === Number(assignment.lecturer_id))
            .filter((mapping) => assignment.group_names.includes(String(mapping?.Group?.name || '').trim()));

          return matchingMappings.length === 0;
        });

        if (hasMissingAssignmentMapping) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Course mapping assignment mismatch',
            error:
              'No course mapping found for one or more lecturer-group assignments using the selected Academic Year, Class, and Term',
          });
        }

        const representativeAssignment =
          resolvedAssignments.find((assignment) => assignment.group_names.length > 0) ||
          resolvedAssignments[0] ||
          null;
        const representativeGroupName = representativeAssignment?.group_names?.[0] || null;

        courseMapping =
          candidateMappings.find(
            (mapping) =>
              Number(mapping.lecturer_profile_id) === Number(representativeAssignment?.lecturer_id) &&
              (!representativeGroupName ||
                normalizeEvaluationGroupLookupValue(mapping?.Group?.name) ===
                  normalizeEvaluationGroupLookupValue(representativeGroupName))
          ) ||
          candidateMappings[0] ||
          null;

        courseMapping.__resolvedUploadGroups = {
          normalizedParsedRows,
          fileGroupNames,
          fileGroupLookup,
          resolvedAssignments,
        };
      } else {
        courseMapping = await CourseMapping.findOne({
          where: {
            lecturer_profile_id: normalizedAssignments[0]?.lecturer_id,
          },
          include: [
            {
              model: ClassModel,
              where: { specialization_id: specialization.id },
              required: true,
              attributes: ['id', 'name', 'term', 'year_level', 'academic_year', 'specialization_id'],
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
          ],
          transaction,
        });
      }
    }

    if (!courseMapping) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Course mapping not found',
        error: `No course mapping found for lecturer ${normalizedAssignments[0]?.lecturer_id} and specialization "${specializationName}"`,
      });
    }

    if (courseMapping?.Class?.specialization_id !== specialization.id) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Specialization mismatch',
        error:
          'The uploaded file specialization does not match the selected course mapping specialization',
      });
    }

    const resolvedGroupData = courseMapping.__resolvedUploadGroups || resolveEvaluationUploadGroups(
      parsedRows,
      normalizedAssignments,
      (
        await Group.findAll({
          where: { class_id: courseMapping.Class.id },
          attributes: ['name'],
          transaction,
        })
      )
        .map((group) => group.name)
        .filter(Boolean)
    );

    const {
      normalizedParsedRows,
      fileGroupNames,
      fileGroupLookup,
      resolvedAssignments,
    } = resolvedGroupData;

    const unknownAssignedGroups = resolvedAssignments.flatMap((assignment) =>
      assignment.group_names.filter(
        (groupName) => !fileGroupLookup.byNormalized.has(normalizeEvaluationGroupLookupValue(groupName))
      )
    );

    if (unknownAssignedGroups.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Assigned groups not found in file',
        error: `These assigned groups do not appear in the uploaded file: ${Array.from(new Set(unknownAssignedGroups)).join(', ')}`,
      });
    }

    const lecturerIds = resolvedAssignments.map((assignment) => assignment.lecturer_id);
    const assignmentMappings = await CourseMapping.findAll({
      where: {
        lecturer_profile_id: lecturerIds,
        class_id: courseMapping.class_id,
        term: courseMapping.term,
        academic_year: courseMapping.academic_year,
      },
      include: [
        {
          model: Group,
          attributes: ['id', 'name', 'class_id'],
          required: false,
        },
        {
          model: Course,
          attributes: ['id', 'course_name'],
          required: false,
        },
      ],
      attributes: ['id', 'lecturer_profile_id', 'group_id', 'class_id', 'course_id', 'term', 'academic_year'],
      transaction,
    });

    const availableMappingGroupKeys = new Set(
      assignmentMappings
        .filter((mapping) => mapping?.lecturer_profile_id && mapping?.Group?.name)
        .map(
          (mapping) =>
            `${mapping.lecturer_profile_id}|${normalizeEvaluationGroupLookupValue(mapping.Group.name)}`
        )
    );

    for (const assignment of resolvedAssignments) {
      if (assignment.group_names.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Missing group assignments',
          error: `Lecturer ${assignment.lecturer_name} must be assigned to at least one group`,
        });
      }

      const missingGroupsForLecturer = assignment.group_names.filter((groupName) => {
        const key = `${assignment.lecturer_id}|${normalizeEvaluationGroupLookupValue(groupName)}`;
        return !availableMappingGroupKeys.has(key);
      });

      if (missingGroupsForLecturer.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Course mapping assignment mismatch',
          error: `No course mapping found for ${assignment.lecturer_name} in groups: ${missingGroupsForLecturer.join(', ')}`,
        });
      }
    }

    const assignedGroups = new Set(
      resolvedAssignments.flatMap((assignment) => assignment.group_names.map((groupName) => String(groupName)))
    );
    const unassignedFileGroups = fileGroupNames.filter((groupName) => !assignedGroups.has(groupName));
    if (unassignedFileGroups.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Unassigned groups in upload file',
        error: `Assign lecturers to every group in the file before upload: ${unassignedFileGroups.join(', ')}`,
      });
    }

    const lecturerAssignmentsByGroup = resolvedAssignments.reduce((acc, assignment) => {
      assignment.group_names.forEach((groupName) => {
        if (!acc[groupName]) {
          acc[groupName] = [];
        }
        acc[groupName].push(assignment);
      });
      return acc;
    }, {});

    const metadataOffset = 7; // Column A-G (metadata)
    const questionsPerLecturer = 5;
    const blockSize = 6; // 5 ratings + 1 comment
    const numLecturers = resolvedAssignments.length;
    const selectedAssignmentKeys = new Set(
      resolvedAssignments.flatMap((assignment) =>
        assignment.group_names.map(
          (groupName) => `${assignment.lecturer_id}|${normalizeEvaluationGroupLookupValue(groupName)}`
        )
      )
    );
    const resolvedCourseNames = Array.from(
      new Set(
        assignmentMappings
          .filter((mapping) => {
            const key = `${mapping.lecturer_profile_id}|${normalizeEvaluationGroupLookupValue(mapping?.Group?.name)}`;
            return selectedAssignmentKeys.has(key);
          })
          .map((mapping) => String(mapping?.Course?.course_name || '').trim())
          .filter(Boolean)
      )
    );
    const resolvedCourseLabel =
      resolvedCourseNames.length === 1
        ? resolvedCourseNames[0]
        : resolvedCourseNames.length > 1
          ? 'Multiple Courses'
          : courseMapping?.Course?.course_name || null;

    // Create evaluation with the selected or resolved course mapping as the anchor context.
    const evaluation = await Evaluation.create(
      { course_mapping_id: courseMapping.id },
      { transaction }
    );

    // Create lecturer mappings
    const lecturerData = resolvedAssignments.map((assignment, index) => ({
      evaluation_id: evaluation.id,
      lecturer_id: assignment.lecturer_id,
      order_index: assignment.order_index || index + 1,
    }));

    await EvaluationLecturer.bulkCreate(lecturerData, { transaction });

    // Import evaluation data
    let submissionCount = 0;
    for (const parsedRow of normalizedParsedRows) {
      const row = parsedRow.row;
      const rowSpecialization = parsedRow.specializationName || specializationName;
      const group_name = parsedRow.groupName;

      if (!group_name) continue;

      const lecturersForGroup = lecturerAssignmentsByGroup[group_name] || [];
      if (lecturersForGroup.length === 0) continue;

      // Create submission
      const submission = await EvaluationSubmission.create(
        {
          evaluation_id: evaluation.id,
          specialization: rowSpecialization,
          group_name,
        },
        { transaction }
      );

      // Process only lecturers assigned to this group, using the global block order from the upload.
      for (const assignment of lecturersForGroup) {
        const baseIndex = metadataOffset + (assignment.order_index - 1) * blockSize;
        const commentValue = row[baseIndex + 5];
        const comment = commentValue ? String(commentValue).trim() : '';

        const lecturerEval = await LecturerEvaluation.create(
          {
            submission_id: submission.id,
            lecturer_id: assignment.lecturer_id,
            comment: comment,
          },
          { transaction }
        );

        // Insert 5 ratings for this lecturer
        for (let q = 0; q < questionsPerLecturer; q++) {
          const rating = row[baseIndex + q];

          if (rating === null || rating === undefined || rating === '') continue;

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

    try {
      const socketService = getNotificationSocket();
      socketService?.io?.to('role:admin').emit('evaluation:uploaded', {
        evaluation_id: evaluation.id,
        course_mapping_id: evaluation.course_mapping_id,
        uploaded_at: new Date().toISOString(),
      });
    } catch (socketErr) {
      console.error(
        'Failed to emit evaluation:uploaded socket event:',
        socketErr?.message || socketErr
      );
    }

    res.status(201).json({
      message: 'Evaluation uploaded successfully',
      evaluation_id: evaluation.id,
      course_mapping_id: evaluation.course_mapping_id,
      course_info: {
        course_name: resolvedCourseLabel,
        course_names: resolvedCourseNames,
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
        groups: fileGroupNames.length,
      },
      processed_groups: fileGroupNames,
      lecturer_assignments: resolvedAssignments.map((assignment) => ({
        lecturer_id: assignment.lecturer_id,
        lecturer_name: assignment.lecturer_name,
        order_index: assignment.order_index,
        group_names: assignment.group_names,
      })),
    });
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }
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
                  attributes: ['id', 'dept_name', 'dept_name_khmer'],
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
    let totalStudents = 0;

    // Collect all lecturer evaluations for this lecturer
    const lecturerEvaluations = [];
    evaluation.EvaluationSubmissions?.forEach((submission) => {
      if (submission.LecturerEvaluations && submission.LecturerEvaluations.length > 0) {
        lecturerEvaluations.push(submission.LecturerEvaluations[0]);
      }
    });

    // Use utility function to calculate averages
    const calculatedData = calculateLecturerAverages(lecturerEvaluations);
    const {
      questionAverages,
      overallAverage,
      comments: allComments,
      responseCount: totalResponseCount,
    } = calculatedData;

    // Get total students from the groups this lecturer actually teaches in this evaluation.
    const scope = getEvaluationScopeDetails(courseMapping);
    const lecturerGroupNames = Array.from(
      new Set(
        evaluation.EvaluationSubmissions?.filter(
          (submission) => submission.LecturerEvaluations && submission.LecturerEvaluations.length > 0
        )
          .map((submission) => submission.group_name)
          .filter(Boolean) || []
      )
    );
    const { byLecturerGroup } = await loadEvaluationCourseMappingLookup({
      classId: scope.classId,
      academicYear: scope.academicYear,
      term: scope.term,
      lecturerIds: [Number(lecturerId)],
      groupNames: lecturerGroupNames,
    });
    const lecturerCourseNames = Array.from(
      new Set(
        lecturerGroupNames
          .map((groupName) =>
            resolveEvaluationCourseOption(
              byLecturerGroup.get(
                `${Number(lecturerId)}|${normalizeEvaluationGroupLookupValue(groupName)}`
              ),
              courseMapping?.Course?.course_name || 'N/A'
            ).courseName
          )
          .filter(Boolean)
      )
    );

    if (courseMapping?.Class) {
      const groups = await Group.findAll({
        where: {
          class_id: courseMapping.Class.id,
          ...(lecturerGroupNames.length > 0 ? { name: lecturerGroupNames } : {}),
        },
        attributes: ['name', 'num_of_student'],
      });
      totalStudents = groups.reduce((sum, g) => sum + (g.num_of_student || 0), 0);
    }

    // Convert numeric values to strings for template
    const questionAveragesStr = Object.fromEntries(
      Object.entries(questionAverages).map(([key, value]) => [key, value.toFixed(1)])
    );
    const overallAverageStr = overallAverage.toFixed(1);
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
    const courseName = escapeHtml(
      lecturerCourseNames.length === 1
        ? lecturerCourseNames[0]
        : lecturerCourseNames.length > 1
          ? 'Multiple Courses'
          : courseMapping?.Course?.course_name || 'N/A'
    );
    const className = escapeHtml(courseMapping?.Class?.name || 'N/A');
    const yearLevel = escapeHtml(courseMapping?.Class?.year_level || 'N/A');
    const term = escapeHtml(courseMapping?.Class?.term || 'N/A');
    const deptNameKhmer = escapeHtml(
      courseMapping?.Class?.Specialization?.Department?.dept_name_khmer || 'N/A'
    );

    // Replace all placeholders
    html = html.replace(/{lecturer_title}/g, lecturerTitle);
    html = html.replace(/{lecturer_name}/g, lecturerFullName);
    html = html.replace(/{course_name}/g, courseName);
    html = html.replace(/{class_name}/g, className);
    html = html.replace(/{year_level}/g, yearLevel);
    html = html.replace(/{term}/g, term);
    html = html.replace(/{dept_name_khmer}/g, deptNameKhmer);
    html = html.replace(/{responses_received}/g, totalResponseCount.toString());
    html = html.replace(/{total_students}/g, totalStudents.toString());
    html = html.replace(/{response_percentage}/g, responsePercentage.toString());

    // Generate evaluation table rows dynamically from database questions
    let evaluationTableRows = '';
    questions.forEach((question) => {
      const qId = question.id;
      const rating = questionAveragesStr[qId] || '0.0';
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
        <td class="score avg-score">${overallAverageStr}</td>
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
