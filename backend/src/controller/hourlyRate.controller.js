import Candidate from '../model/candidate.model.js';
import CourseMapping from '../model/courseMapping.model.js';
import LecturerProfile from '../model/lecturerProfile.model.js';
import Course from '../model/course.model.js';
import { calculateLecturerAverages } from '../utils/evaluationUtils.js';
import LecturerEvaluation from '../model/evaluation/lecturerEvaluation.model.js';
import EvaluationResponse from '../model/evaluation/evaluationResponse.model.js';
import EvaluationSubmission from '../model/evaluation/evaluationSubmission.model.js';
import Evaluation from '../model/evaluation/evaluation.model.js';

// GET /api/hourly-rates
export const getHourlyRate = async (req, res) => {
  try {
    const lecturers = await LecturerProfile.findAll({
      attributes: ['id', 'title', 'gender', 'full_name_english', 'full_name_khmer'],
      include: [
        {
          model: Candidate,
          attributes: ['hourlyRate'],
          required: false,
        },
        {
          model: CourseMapping,
          attributes: ['id', 'term', 'academic_year', 'group_count'],
          required: false,
          include: [
            {
              model: Course,
              attributes: ['id', 'course_name', 'hours'],
            },
          ],
        },
        {
          model: LecturerEvaluation,
          attributes: ['id', 'lecturer_id'],
          required: false,
          include: [
            {
              model: EvaluationResponse,
              attributes: ['question_id', 'rating'],
            },
            {
              model: EvaluationSubmission,
              attributes: ['id', 'evaluation_id'],
              include: [
                {
                  model: Evaluation,
                  attributes: ['id', 'course_mapping_id'],
                  include: [
                    {
                      model: CourseMapping,
                      attributes: ['id', 'term', 'academic_year'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      order: [['full_name_english', 'ASC']],
    });

    // Process each lecturer to calculate term-by-term stats
    const lecturersWithStats = lecturers.map((lecturer) => {
      // Group course mappings by term
      const termHours = {};
      lecturer.CourseMappings?.forEach((mapping) => {
        const termKey = `${mapping.academic_year || ''}-${mapping.term || ''}`;
        if (!termHours[termKey]) {
          termHours[termKey] = {
            term: mapping.term,
            academic_year: mapping.academic_year,
            hours: 0,
            courses: [],
          };
        }
        const courseHours = (mapping.Course?.hours || 0) * (mapping.group_count || 1);
        termHours[termKey].hours += courseHours;
        termHours[termKey].courses.push({
          course_name: mapping.Course?.course_name,
          hours: courseHours,
        });
      });

      // Group evaluations by term
      const termRatings = {};
      lecturer.LecturerEvaluations?.forEach((evaluation) => {
        const courseMapping = evaluation.EvaluationSubmission?.Evaluation?.CourseMapping;
        if (courseMapping) {
          const termKey = `${courseMapping.academic_year || ''}-${courseMapping.term || ''}`;
          if (!termRatings[termKey]) {
            termRatings[termKey] = {
              term: courseMapping.term,
              academic_year: courseMapping.academic_year,
              evaluations: [],
            };
          }
          termRatings[termKey].evaluations.push(evaluation);
        }
      });

      // Calculate ratings per term using the utility function
      Object.keys(termRatings).forEach((termKey) => {
        const termData = termRatings[termKey];
        const { overallAverage } = calculateLecturerAverages(termData.evaluations);

        termData.rating = overallAverage;
        delete termData.evaluations; // Remove raw evaluation data from response
      });

      // Combine term data
      const allTermKeys = new Set([...Object.keys(termHours), ...Object.keys(termRatings)]);
      const termProgress = Array.from(allTermKeys)
        .map((termKey) => ({
          termKey,
          term: termHours[termKey]?.term || termRatings[termKey]?.term,
          academic_year: termHours[termKey]?.academic_year || termRatings[termKey]?.academic_year,
          hours: termHours[termKey]?.hours || 0,
          courses: termHours[termKey]?.courses || [],
          rating: termRatings[termKey]?.rating || null,
        }))
        .sort((a, b) => a.termKey.localeCompare(b.termKey));

      // Calculate totals
      const totalTerms = allTermKeys.size;
      const totalHours = termProgress.reduce((sum, term) => sum + term.hours, 0);

      // Calculate rating sum and average from all terms
      const termRatingsArray = termProgress
        .filter((term) => term.rating !== null)
        .map((term) => term.rating);
      const totalRatingSum =
        termRatingsArray.length > 0
          ? parseFloat(termRatingsArray.reduce((sum, rating) => sum + rating, 0).toFixed(2))
          : null;
      const avgRating =
        termRatingsArray.length > 0
          ? parseFloat((totalRatingSum / termRatingsArray.length).toFixed(2))
          : null;

      return {
        id: lecturer.id,
        title: lecturer.title,
        gender: lecturer.gender,
        full_name_english: lecturer.full_name_english,
        full_name_khmer: lecturer.full_name_khmer,
        hourlyRate: lecturer.Candidate?.hourlyRate ?? null,
        totalTerms,
        totalHours,
        totalRatingSum,
        avgRating,
        termProgress,
      };
    });

    return res.status(200).json({
      lecturers: lecturersWithStats,
      message: 'All lecturers with hourly rates retrieved successfully.',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  }
};

// PUT /api/hourly-rates/lecturer/:lecturerId
export const updateHourlyRate = async (req, res) => {
  try {
    const { lecturerId } = req.params;
    const { hourlyRate } = req.body;

    if (!lecturerId) {
      return res.status(400).json({ message: 'Lecturer ID is required' });
    }

    if (hourlyRate === undefined || hourlyRate === null) {
      return res.status(400).json({ message: 'Hourly rate is required' });
    }

    // Validate hourlyRate is a valid number
    const rateValue = parseFloat(hourlyRate);
    if (isNaN(rateValue) || rateValue <= 0) {
      return res.status(400).json({ message: 'Hourly rate must be a valid positive number' });
    }

    // Find the lecturer profile
    const lecturerProfile = await LecturerProfile.findByPk(lecturerId, {
      include: [
        {
          model: Candidate,
          attributes: ['id', 'hourlyRate'],
        },
      ],
    });

    if (!lecturerProfile) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }

    if (!lecturerProfile.candidate_id) {
      return res.status(404).json({
        message: 'No candidate record linked to this lecturer. Cannot update hourly rate.',
      });
    }

    // Update the candidate's hourly rate
    await Candidate.update(
      { hourlyRate: rateValue },
      { where: { id: lecturerProfile.candidate_id } }
    );

    // Fetch updated candidate to return
    const updatedCandidate = await Candidate.findByPk(lecturerProfile.candidate_id, {
      attributes: ['id', 'fullName', 'hourlyRate'],
    });

    return res.status(200).json({
      message: 'Hourly rate updated successfully',
      lecturer: {
        id: lecturerProfile.id,
        full_name_english: lecturerProfile.full_name_english,
        candidate_id: lecturerProfile.candidate_id,
        hourlyRate: updatedCandidate.hourlyRate,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  }
};
