import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import Candidate from '../model/candidate.model.js';
import CourseMapping from '../model/courseMapping.model.js';
import LecturerProfile from '../model/lecturerProfile.model.js';
import Course from '../model/course.model.js';
import Department from '../model/department.model.js';
import HourlyRateHistory from '../model/hourlyRateHistory.model.js';
import AdvisorContract from '../model/advisorContract.model.js';
import TeachingContract from '../model/teachingContract.model.js';
import TeachingContractCourse from '../model/teachingContractCourse.model.js';
import { calculateLecturerAverages } from '../utils/evaluationUtils.js';
import LecturerEvaluation from '../model/evaluation/lecturerEvaluation.model.js';
import EvaluationResponse from '../model/evaluation/evaluationResponse.model.js';
import EvaluationSubmission from '../model/evaluation/evaluationSubmission.model.js';
import Evaluation from '../model/evaluation/evaluation.model.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function getDefaultAcademicYear() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

function isAcademicYear(value) {
  return /^\d{4}-\d{4}$/.test(String(value || '').trim());
}

function normalizeAcademicYear(value) {
  const raw = String(value || '').trim();
  return isAcademicYear(raw) ? raw : getDefaultAcademicYear();
}

function getAcademicYearStart(value) {
  const [start] = normalizeAcademicYear(value).split('-');
  return Number.parseInt(start, 10);
}

function getPreviousAcademicYears(currentAcademicYear) {
  const start = getAcademicYearStart(currentAcademicYear);
  return [`${start - 2}-${start - 1}`, `${start - 1}-${start}`];
}

function buildTrailingAcademicYears(currentAcademicYear, count = 3) {
  const start = getAcademicYearStart(currentAcademicYear);
  return Array.from({ length: count }, (_, index) => {
    const yearStart = start - (count - 1 - index);
    return `${yearStart}-${yearStart + 1}`;
  });
}

function getNextAcademicYear(currentAcademicYear) {
  const start = getAcademicYearStart(currentAcademicYear);
  return `${start + 1}-${start + 2}`;
}

function compareAcademicYears(left, right) {
  return getAcademicYearStart(left) - getAcademicYearStart(right);
}

function normalizeTermKey(value) {
  const match = String(value || '').match(/([123])/);
  return match ? `term${match[1]}` : null;
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function toRoundedNumber(value, digits = 2) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(digits)) : null;
}

function getKhmerTitle(value) {
  const map = {
    Mr: 'លោក',
    Ms: 'កញ្ញា',
    Mrs: 'លោកស្រី',
    Dr: 'បណ្ឌិត',
    Prof: 'សាស្ត្រាចារ្យ',
  };
  return map[value] || '';
}

function getGenderLabel(value) {
  const map = { male: 'Male', female: 'Female', other: 'Other' };
  return map[String(value || '').toLowerCase()] || '';
}

function buildTermSlots() {
  return {
    term1: { hours: 0, feedback: null },
    term2: { hours: 0, feedback: null },
    term3: { hours: 0, feedback: null },
  };
}

function getAdvisorContributionTotals(contracts) {
  return (contracts || []).reduce(
    (acc, contract) => {
      const studentsCount = Array.isArray(contract?.students) ? contract.students.length : 0;
      if (contract?.capstone_1) acc.capstone1 += studentsCount;
      if (contract?.capstone_2) acc.capstone2 += studentsCount;
      if (contract?.internship_1) acc.internship1 += studentsCount;
      if (contract?.internship_2) acc.internship2 += studentsCount;
      return acc;
    },
    { capstone1: 0, capstone2: 0, internship1: 0, internship2: 0 }
  );
}

function getLatestRateValue(rateMap, rateAcademicYears) {
  const populatedRates = (rateAcademicYears || [])
    .map((academicYear) => toNullableNumber(rateMap?.[academicYear]))
    .filter((rate) => rate !== null);
  if (!populatedRates.length) return null;
  return toRoundedNumber(populatedRates[populatedRates.length - 1], 2);
}

function calculateIncreaseRate(latestRate, nextYearRate) {
  const normalizedLatestRate = toNullableNumber(latestRate);
  const normalizedNextYearRate = toNullableNumber(nextYearRate);
  if (normalizedLatestRate === null || normalizedNextYearRate === null) return null;
  return toRoundedNumber(normalizedNextYearRate - normalizedLatestRate, 2);
}

function buildTeachingHoursByUserId(contracts) {
  const hoursByUserId = new Map();
  (contracts || []).forEach((contract) => {
    const lecturerUserId = Number(contract?.lecturer_user_id);
    if (!Number.isInteger(lecturerUserId)) return;
    const contractCourses = Array.isArray(contract?.contractCourses) ? contract.contractCourses : [];
    if (!hoursByUserId.has(lecturerUserId)) hoursByUserId.set(lecturerUserId, buildTermSlots());
    const termSlots = hoursByUserId.get(lecturerUserId);
    contractCourses.forEach((course) => {
      const termKey = normalizeTermKey(course?.term || contract?.term);
      if (!termKey || !termSlots[termKey]) return;
      termSlots[termKey].hours += Number(course?.hours || 0);
    });
  });
  return hoursByUserId;
}

function getFeedbackAverage(termSlots) {
  const feedbackValues = Object.values(termSlots)
    .map((term) => term.feedback)
    .filter((value) => value !== null && value !== undefined);
  if (!feedbackValues.length) return null;
  const sum = feedbackValues.reduce((acc, value) => acc + Number(value || 0), 0);
  return toRoundedNumber(sum / feedbackValues.length, 2);
}

function getTotalTerms(termSlots) {
  return Object.values(termSlots).filter(
    (term) => Number(term.hours || 0) > 0 || term.feedback !== null
  ).length;
}

function buildMappingDepartmentByLecturerId(courseMappings) {
  const mappingDepartmentByLecturerId = new Map();
  (courseMappings || []).forEach((mapping) => {
    const lecturerProfileId = Number(mapping?.lecturer_profile_id);
    if (!Number.isInteger(lecturerProfileId) || mappingDepartmentByLecturerId.has(lecturerProfileId)) {
      return;
    }
    const department = mapping?.Department;
    if (!department) return;
    mappingDepartmentByLecturerId.set(lecturerProfileId, department);
  });
  return mappingDepartmentByLecturerId;
}

function buildFeedbackByLecturerId(evaluations) {
  const evaluationsByLecturerId = new Map();
  (evaluations || []).forEach((evaluation) => {
    const lecturerProfileId = Number(evaluation?.lecturer_id);
    if (!Number.isInteger(lecturerProfileId)) return;
    const courseMapping = evaluation?.EvaluationSubmission?.Evaluation?.CourseMapping;
    const termKey = normalizeTermKey(courseMapping?.term);
    if (!termKey) return;
    if (!evaluationsByLecturerId.has(lecturerProfileId)) {
      evaluationsByLecturerId.set(lecturerProfileId, { term1: [], term2: [], term3: [] });
    }
    evaluationsByLecturerId.get(lecturerProfileId)[termKey].push(evaluation);
  });

  const feedbackByLecturerId = new Map();
  evaluationsByLecturerId.forEach((termEvaluations, lecturerProfileId) => {
    const termSlots = buildTermSlots();
    Object.entries(termEvaluations).forEach(([termKey, entries]) => {
      if (!entries.length) return;
      const { overallAverage } = calculateLecturerAverages(entries);
      termSlots[termKey].feedback = toRoundedNumber(overallAverage, 2);
    });
    feedbackByLecturerId.set(lecturerProfileId, termSlots);
  });

  return feedbackByLecturerId;
}

function resolveDepartment(lecturer, candidateDepartmentMap, mappingDepartmentByLecturerId) {
  if (Array.isArray(lecturer?.Departments) && lecturer.Departments.length > 0) {
    return lecturer.Departments[0];
  }
  const candidateDeptId = lecturer?.Candidate?.dept_id;
  if (candidateDeptId && candidateDepartmentMap.has(candidateDeptId)) {
    return candidateDepartmentMap.get(candidateDeptId);
  }
  return mappingDepartmentByLecturerId.get(Number(lecturer?.id)) || null;
}

function buildContractRateMap(contracts, currentAcademicYear) {
  const contractRateMap = new Map();
  (contracts || []).forEach((contract) => {
    const academicYear = String(contract?.academic_year || '').trim();
    if (!/^\d{4}-\d{4}$/.test(academicYear)) return;
    if (compareAcademicYears(academicYear, currentAcademicYear) > 0) return;
    const lecturerUserId = Number(contract?.lecturer_user_id);
    if (!Number.isInteger(lecturerUserId)) return;
    const parsedRate = toNullableNumber(contract?.hourly_rate);
    if (parsedRate === null) return;
    const mapKey = `${lecturerUserId}:${academicYear}`;
    const candidateTimestamp = new Date(
      contract?.updated_at || contract?.updatedAt || contract?.created_at || contract?.createdAt || 0
    ).getTime();
    const existing = contractRateMap.get(mapKey);
    if (!existing || candidateTimestamp >= existing.timestamp) {
      contractRateMap.set(mapKey, { rate: toRoundedNumber(parsedRate, 2), timestamp: candidateTimestamp });
    }
  });
  return contractRateMap;
}

async function getLatestAvailableAcademicYear() {
  const defaultAcademicYear = getDefaultAcademicYear();
  const [teachingCourseYear, advisorYear, courseMappingYear, historyYear] = await Promise.all([
    TeachingContractCourse.max('academic_year'),
    AdvisorContract.max('academic_year'),
    CourseMapping.max('academic_year'),
    HourlyRateHistory.max('academic_year'),
  ]);

  const workloadAcademicYears = [teachingCourseYear, advisorYear, courseMappingYear].filter(
    (value) => isAcademicYear(value)
  );
  if (workloadAcademicYears.length) {
    return workloadAcademicYears.sort(compareAcademicYears).at(-1);
  }

  const academicYears = [historyYear].filter((value) => isAcademicYear(value));
  if (!academicYears.length) return defaultAcademicYear;

  const latestAvailableAcademicYear = academicYears.sort(compareAcademicYears).at(-1);
  return compareAcademicYears(latestAvailableAcademicYear, defaultAcademicYear) > 0
    ? defaultAcademicYear
    : latestAvailableAcademicYear;
}

async function resolveReportAcademicYear(value) {
  if (isAcademicYear(value)) return String(value).trim();
  return getLatestAvailableAcademicYear();
}

async function resolveAdminDepartment({ role, departmentName }, transaction) {
  if (String(role || '').toLowerCase() !== 'admin') return null;
  const deptName = String(departmentName || '').trim();
  if (!deptName) return { id: null, dept_name: '' };
  const dept = await Department.findOne({
    where: { dept_name: deptName },
    attributes: ['id', 'dept_name', 'dept_name_khmer'],
    transaction,
  });
  return dept ? dept.get({ plain: true }) : { id: null, dept_name: deptName, dept_name_khmer: '' };
}

async function buildRateHourReport(currentAcademicYear, departmentScope = null) {
  const previousAcademicYears = getPreviousAcademicYears(currentAcademicYear);
  const nextAcademicYear = getNextAcademicYear(currentAcademicYear);
  const guaranteedRateAcademicYears = buildTrailingAcademicYears(currentAcademicYear, 3);

  const lecturers = await LecturerProfile.findAll({
    attributes: ['id', 'user_id', 'title', 'gender', 'full_name_english', 'full_name_khmer'],
    include: [
      { model: Candidate, attributes: ['id', 'hourlyRate', 'dept_id'], required: false },
      {
        model: Department,
        attributes: ['id', 'dept_name', 'dept_name_khmer'],
        required: false,
        through: { attributes: [] },
      },
      {
        model: HourlyRateHistory,
        as: 'HourlyRateHistories',
        attributes: ['academic_year', 'rate', 'remark'],
        required: false,
      },
    ],
    order: [['full_name_english', 'ASC']],
  });

  const candidateDeptIds = Array.from(
    new Set(
      lecturers
        .map((l) => l?.Candidate?.dept_id)
        .filter((value) => Number.isInteger(value))
    )
  );
  const candidateDepartments = candidateDeptIds.length
    ? await Department.findAll({
        attributes: ['id', 'dept_name', 'dept_name_khmer'],
        where: { id: { [Op.in]: candidateDeptIds } },
      })
    : [];
  const candidateDepartmentMap = new Map(candidateDepartments.map((d) => [d.id, d]));

  const lecturerUserIds = Array.from(
    new Set(lecturers.map((l) => Number(l.user_id)).filter((id) => Number.isInteger(id)))
  );
  const lecturerProfileIds = Array.from(
    new Set(lecturers.map((l) => Number(l.id)).filter((id) => Number.isInteger(id)))
  );

  const [currentYearCourseMappings, teachingContracts, historicalTeachingContracts, advisorContracts, currentYearEvaluations] =
    await Promise.all([
      lecturerProfileIds.length
        ? CourseMapping.findAll({
            attributes: ['lecturer_profile_id', 'dept_id'],
            where: {
              academic_year: currentAcademicYear,
              lecturer_profile_id: { [Op.in]: lecturerProfileIds },
            },
            include: [
              { model: Department, attributes: ['id', 'dept_name', 'dept_name_khmer'], required: false },
            ],
          })
        : [],
      lecturerUserIds.length
        ? TeachingContract.findAll({
            attributes: ['id', 'lecturer_user_id', 'term', 'academic_year', 'hourly_rate', 'updated_at', 'created_at'],
            where: {
              lecturer_user_id: { [Op.in]: lecturerUserIds },
              academic_year: currentAcademicYear,
            },
            include: [
              {
                model: TeachingContractCourse,
                as: 'contractCourses',
                attributes: ['term', 'academic_year', 'hours'],
                required: false,
                where: { academic_year: currentAcademicYear },
              },
            ],
          })
        : [],
      lecturerUserIds.length
        ? TeachingContract.findAll({
            attributes: ['lecturer_user_id', 'academic_year', 'hourly_rate', 'updated_at', 'created_at'],
            where: {
              lecturer_user_id: { [Op.in]: lecturerUserIds },
              hourly_rate: { [Op.ne]: null },
            },
          })
        : [],
      lecturerUserIds.length
        ? AdvisorContract.findAll({
            attributes: [
              'lecturer_user_id',
              'academic_year',
              'hourly_rate',
              'capstone_1',
              'capstone_2',
              'internship_1',
              'internship_2',
              'students',
              'updated_at',
              'created_at',
            ],
            where: { lecturer_user_id: { [Op.in]: lecturerUserIds } },
          })
        : [],
      lecturerProfileIds.length
        ? LecturerEvaluation.findAll({
            attributes: ['id', 'lecturer_id'],
            where: { lecturer_id: { [Op.in]: lecturerProfileIds } },
            include: [
              { model: EvaluationResponse, attributes: ['question_id', 'rating'], required: false },
              {
                model: EvaluationSubmission,
                attributes: ['id', 'evaluation_id'],
                required: true,
                include: [
                  {
                    model: Evaluation,
                    attributes: ['id', 'course_mapping_id'],
                    required: true,
                    include: [
                      {
                        model: CourseMapping,
                        attributes: ['id', 'term', 'academic_year'],
                        required: true,
                        where: { academic_year: currentAcademicYear },
                      },
                    ],
                  },
                ],
              },
            ],
          })
        : [],
    ]);

  const advisorContractsByUserId = advisorContracts.reduce((acc, contract) => {
    if (contract.academic_year !== currentAcademicYear) return acc;
    const userId = Number(contract.lecturer_user_id);
    if (!acc.has(userId)) acc.set(userId, []);
    acc.get(userId).push(contract);
    return acc;
  }, new Map());

  const teachingHoursByUserId = buildTeachingHoursByUserId(teachingContracts);
  const mappingDepartmentByLecturerId = buildMappingDepartmentByLecturerId(currentYearCourseMappings);
  const feedbackByLecturerId = buildFeedbackByLecturerId(currentYearEvaluations);
  const contractRateMap = buildContractRateMap(
    [...historicalTeachingContracts, ...advisorContracts],
    currentAcademicYear
  );
  const rateAcademicYears = guaranteedRateAcademicYears;

  const lecturerRows = lecturers
    .map((lecturer) => {
      const department = resolveDepartment(lecturer, candidateDepartmentMap, mappingDepartmentByLecturerId);
      const teachingHours = teachingHoursByUserId.get(Number(lecturer.user_id));
      const feedbackSlots = feedbackByLecturerId.get(Number(lecturer.id));
      const termSlots = {
        term1: {
          hours: Number(teachingHours?.term1?.hours || 0),
          feedback: feedbackSlots?.term1?.feedback ?? null,
        },
        term2: {
          hours: Number(teachingHours?.term2?.hours || 0),
          feedback: feedbackSlots?.term2?.feedback ?? null,
        },
        term3: {
          hours: Number(teachingHours?.term3?.hours || 0),
          feedback: feedbackSlots?.term3?.feedback ?? null,
        },
      };

      const rateMap = rateAcademicYears.reduce((acc, academicYear) => {
        const match = (lecturer.HourlyRateHistories || []).find(
          (h) => h.academic_year === academicYear
        );
        const contractRate =
          contractRateMap.get(`${Number(lecturer.user_id)}:${academicYear}`)?.rate ?? null;
        acc[academicYear] =
          match?.rate !== null && match?.rate !== undefined
            ? toRoundedNumber(match.rate, 2)
            : contractRate;
        return acc;
      }, {});

      if (
        (rateMap[currentAcademicYear] === null || rateMap[currentAcademicYear] === undefined) &&
        lecturer.Candidate?.hourlyRate !== null &&
        lecturer.Candidate?.hourlyRate !== undefined
      ) {
        rateMap[currentAcademicYear] = toRoundedNumber(lecturer.Candidate.hourlyRate, 2);
      }

      const nextYearHistory = (lecturer.HourlyRateHistories || []).find(
        (h) => h.academic_year === nextAcademicYear
      );
      const latestRate = getLatestRateValue(rateMap, rateAcademicYears);
      const nextYearRate =
        nextYearHistory?.rate !== null && nextYearHistory?.rate !== undefined
          ? toRoundedNumber(nextYearHistory.rate, 2)
          : null;
      const totalHours = toRoundedNumber(
        Object.values(termSlots).reduce((sum, term) => sum + Number(term.hours || 0), 0),
        2
      );
      const averageFeedback = getFeedbackAverage(termSlots);
      const increaseRate = calculateIncreaseRate(latestRate, nextYearRate);
      const contributions = getAdvisorContributionTotals(
        advisorContractsByUserId.get(Number(lecturer.user_id)) || []
      );

      return {
        lecturerId: lecturer.id,
        userId: lecturer.user_id,
        department: {
          id: department?.id || null,
          englishName: department?.dept_name || '',
          khmerName: department?.dept_name_khmer || '',
        },
        lecturer: {
          englishName: lecturer.full_name_english || '',
          khmerName: lecturer.full_name_khmer || '',
          gender: getGenderLabel(lecturer.gender),
          englishTitle: lecturer.title || '',
          khmerTitle: getKhmerTitle(lecturer.title),
        },
        rates: rateMap,
        academicYear: {
          value: currentAcademicYear,
          term1: termSlots.term1,
          term2: termSlots.term2,
          term3: termSlots.term3,
        },
        additionalContribution: {
          capstone1: contributions.capstone1,
          capstone2: contributions.capstone2,
          internship1: contributions.internship1,
          internship2: contributions.internship2,
        },
        summary: {
          totalTerms: getTotalTerms(termSlots),
          totalHours,
          averageFeedback,
          latestRate,
          increaseRate,
          increaseRateApplied: increaseRate !== null && increaseRate > 0,
          nextAcademicYearRate: nextYearRate,
          remark: nextYearHistory?.remark || '',
        },
      };
    })
    .filter((row) => {
      const hasDepartment =
        row.department.id !== null || row.department.englishName || row.department.khmerName;
      if (!hasDepartment) return false;
      if (!departmentScope) return true;
      if (departmentScope.id && row.department.id) {
        return Number(row.department.id) === Number(departmentScope.id);
      }
      return (
        String(row.department.englishName || '').trim() ===
        String(departmentScope.dept_name || '').trim()
      );
    });

  return {
    academicYear: currentAcademicYear,
    latestAcademicYear: currentAcademicYear,
    previousAcademicYears,
    rateAcademicYears,
    nextAcademicYear,
    lecturers: lecturerRows,
  };
}

// ---------------------------------------------------------------------------
// Service: getHourlyRateData
// ---------------------------------------------------------------------------

export async function getHourlyRateData() {
  const lecturers = await LecturerProfile.findAll({
    attributes: ['id', 'title', 'gender', 'full_name_english', 'full_name_khmer'],
    include: [
      { model: Candidate, attributes: ['hourlyRate'], required: false },
      {
        model: CourseMapping,
        attributes: ['id', 'term', 'academic_year', 'group_count'],
        required: false,
        include: [{ model: Course, attributes: ['id', 'course_name', 'hours'] }],
      },
      {
        model: LecturerEvaluation,
        attributes: ['id', 'lecturer_id'],
        required: false,
        include: [
          { model: EvaluationResponse, attributes: ['question_id', 'rating'] },
          {
            model: EvaluationSubmission,
            attributes: ['id', 'evaluation_id'],
            include: [
              {
                model: Evaluation,
                attributes: ['id', 'course_mapping_id'],
                include: [
                  { model: CourseMapping, attributes: ['id', 'term', 'academic_year'] },
                ],
              },
            ],
          },
        ],
      },
    ],
    order: [['full_name_english', 'ASC']],
  });

  const lecturersWithStats = lecturers.map((lecturer) => {
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

    Object.keys(termRatings).forEach((termKey) => {
      const termData = termRatings[termKey];
      const { overallAverage } = calculateLecturerAverages(termData.evaluations);
      termData.rating = overallAverage;
      delete termData.evaluations;
    });

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

    const totalTerms = allTermKeys.size;
    const totalHours = termProgress.reduce((sum, term) => sum + term.hours, 0);
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

  return {
    lecturers: lecturersWithStats,
    message: 'All lecturers with hourly rates retrieved successfully.',
  };
}

// ---------------------------------------------------------------------------
// Service: getHourlyRateReportData
// ---------------------------------------------------------------------------

export async function getHourlyRateReportData({ academicYear, role, departmentName }) {
  const resolvedAcademicYear = await resolveReportAcademicYear(academicYear);
  const adminDepartment = await resolveAdminDepartment({ role, departmentName });

  if (String(role || '').toLowerCase() === 'admin' && !adminDepartment?.id) {
    return {
      message: 'Rate hour report retrieved successfully.',
      academicYear: resolvedAcademicYear,
      latestAcademicYear: resolvedAcademicYear,
      previousAcademicYears: getPreviousAcademicYears(resolvedAcademicYear),
      rateAcademicYears: buildTrailingAcademicYears(resolvedAcademicYear, 3),
      nextAcademicYear: getNextAcademicYear(resolvedAcademicYear),
      lecturers: [],
    };
  }

  const report = await buildRateHourReport(resolvedAcademicYear, adminDepartment);
  return { message: 'Rate hour report retrieved successfully.', ...report };
}

// ---------------------------------------------------------------------------
// Service: updateHourlyRateData
// ---------------------------------------------------------------------------

export async function updateHourlyRateData(lecturerId, { hourlyRate }) {
  if (!lecturerId) {
    throw new ValidationError('Lecturer ID is required', {
      payload: { message: 'Lecturer ID is required' },
    });
  }
  if (hourlyRate === undefined || hourlyRate === null) {
    throw new ValidationError('Hourly rate is required', {
      payload: { message: 'Hourly rate is required' },
    });
  }

  const rateValue = parseFloat(hourlyRate);
  if (isNaN(rateValue) || rateValue <= 0) {
    throw new ValidationError('Hourly rate must be a valid positive number', {
      payload: { message: 'Hourly rate must be a valid positive number' },
    });
  }

  const lecturerProfile = await LecturerProfile.findByPk(lecturerId, {
    include: [{ model: Candidate, attributes: ['id', 'hourlyRate'] }],
  });
  if (!lecturerProfile) {
    throw new NotFoundError('Lecturer not found', { payload: { message: 'Lecturer not found' } });
  }
  if (!lecturerProfile.candidate_id) {
    throw new NotFoundError(
      'No candidate record linked to this lecturer. Cannot update hourly rate.',
      {
        payload: {
          message: 'No candidate record linked to this lecturer. Cannot update hourly rate.',
        },
      }
    );
  }

  await Candidate.update({ hourlyRate: rateValue }, { where: { id: lecturerProfile.candidate_id } });

  const updatedCandidate = await Candidate.findByPk(lecturerProfile.candidate_id, {
    attributes: ['id', 'fullName', 'hourlyRate'],
  });

  return {
    message: 'Hourly rate updated successfully',
    lecturer: {
      id: lecturerProfile.id,
      full_name_english: lecturerProfile.full_name_english,
      candidate_id: lecturerProfile.candidate_id,
      hourlyRate: updatedCandidate.hourlyRate,
    },
  };
}

// ---------------------------------------------------------------------------
// Service: updateHourlyRateReportData
// ---------------------------------------------------------------------------

export async function updateHourlyRateReportData(
  lecturerId,
  { increaseRate, rates = {}, remark = '', currentAcademicYear = getDefaultAcademicYear() },
  { role, departmentName }
) {
  if (!lecturerId) {
    throw new ValidationError('Lecturer ID is required', {
      payload: { message: 'Lecturer ID is required' },
    });
  }

  const normalizedCurrentAcademicYear = normalizeAcademicYear(currentAcademicYear);
  const nextAcademicYear = getNextAcademicYear(normalizedCurrentAcademicYear);
  const editableIncreaseRate = increaseRate !== undefined ? increaseRate : rates?.[nextAcademicYear];

  const transaction = await sequelize.transaction();
  try {
    const adminDepartment = await resolveAdminDepartment({ role, departmentName }, transaction);

    if (String(role || '').toLowerCase() === 'admin' && !adminDepartment?.id) {
      await transaction.rollback();
      throw new ForbiddenError('Access denied: admin department not found', {
        payload: { message: 'Access denied: admin department not found' },
      });
    }

    const lecturerProfile = await LecturerProfile.findByPk(lecturerId, {
      include: [
        { model: Candidate, attributes: ['id', 'hourlyRate', 'dept_id'], required: false },
        {
          model: Department,
          attributes: ['id', 'dept_name', 'dept_name_khmer'],
          required: false,
          through: { attributes: [] },
        },
        {
          model: HourlyRateHistory,
          as: 'HourlyRateHistories',
          attributes: ['academic_year', 'rate'],
          required: false,
          where: {
            academic_year: {
              [Op.in]: buildTrailingAcademicYears(normalizedCurrentAcademicYear, 3),
            },
          },
        },
      ],
      transaction,
    });

    if (!lecturerProfile) {
      await transaction.rollback();
      throw new NotFoundError('Lecturer not found', { payload: { message: 'Lecturer not found' } });
    }

    if (adminDepartment) {
      let resolvedDepartment =
        Array.isArray(lecturerProfile.Departments) && lecturerProfile.Departments.length > 0
          ? lecturerProfile.Departments[0]
          : null;

      if (!resolvedDepartment && Number.isInteger(lecturerProfile.Candidate?.dept_id)) {
        resolvedDepartment = await Department.findByPk(lecturerProfile.Candidate.dept_id, {
          attributes: ['id', 'dept_name', 'dept_name_khmer'],
          transaction,
        });
      }

      if (!resolvedDepartment) {
        const mappingDepartment = await CourseMapping.findOne({
          attributes: ['dept_id'],
          where: {
            lecturer_profile_id: lecturerProfile.id,
            academic_year: normalizedCurrentAcademicYear,
            dept_id: { [Op.ne]: null },
          },
          include: [
            {
              model: Department,
              attributes: ['id', 'dept_name', 'dept_name_khmer'],
              required: true,
            },
          ],
          order: [
            ['updated_at', 'DESC'],
            ['id', 'DESC'],
          ],
          transaction,
        });
        resolvedDepartment = mappingDepartment?.Department || null;
      }

      const canAccessLecturer =
        resolvedDepartment &&
        ((adminDepartment.id &&
          resolvedDepartment.id &&
          Number(resolvedDepartment.id) === Number(adminDepartment.id)) ||
          String(resolvedDepartment.dept_name || '').trim() ===
            String(adminDepartment.dept_name || '').trim());

      if (!canAccessLecturer) {
        await transaction.rollback();
        throw new NotFoundError('Lecturer not found', { payload: { message: 'Lecturer not found' } });
      }
    }

    const rateAcademicYears = buildTrailingAcademicYears(normalizedCurrentAcademicYear, 3);
    const [historicalTeachingContracts, historicalAdvisorContracts] = await Promise.all([
      TeachingContract.findAll({
        attributes: ['lecturer_user_id', 'academic_year', 'hourly_rate', 'updated_at', 'created_at'],
        where: {
          lecturer_user_id: Number(lecturerProfile.user_id),
          hourly_rate: { [Op.ne]: null },
        },
        transaction,
      }),
      AdvisorContract.findAll({
        attributes: ['lecturer_user_id', 'academic_year', 'hourly_rate', 'updated_at', 'created_at'],
        where: { lecturer_user_id: Number(lecturerProfile.user_id) },
        transaction,
      }),
    ]);

    const contractRateMap = buildContractRateMap(
      [...historicalTeachingContracts, ...historicalAdvisorContracts],
      normalizedCurrentAcademicYear
    );

    const rateMap = rateAcademicYears.reduce((acc, academicYear) => {
      const history = (lecturerProfile.HourlyRateHistories || []).find(
        (entry) => entry.academic_year === academicYear
      );
      const contractRate =
        contractRateMap.get(`${Number(lecturerProfile.user_id)}:${academicYear}`)?.rate ?? null;
      acc[academicYear] =
        history?.rate !== null && history?.rate !== undefined
          ? toRoundedNumber(history.rate, 2)
          : contractRate;
      return acc;
    }, {});

    if (
      (rateMap[normalizedCurrentAcademicYear] === null ||
        rateMap[normalizedCurrentAcademicYear] === undefined) &&
      lecturerProfile.Candidate?.hourlyRate !== null &&
      lecturerProfile.Candidate?.hourlyRate !== undefined
    ) {
      rateMap[normalizedCurrentAcademicYear] = toRoundedNumber(
        lecturerProfile.Candidate.hourlyRate,
        2
      );
    }

    const latestRate = getLatestRateValue(rateMap, rateAcademicYears);

    for (const academicYear of Object.keys(rates)) {
      if (!/^\d{4}-\d{4}$/.test(academicYear)) {
        await transaction.rollback();
        throw new ValidationError(`Invalid academic year provided: ${academicYear}`, {
          payload: { message: `Invalid academic year provided: ${academicYear}` },
        });
      }
      if (academicYear !== nextAcademicYear) {
        await transaction.rollback();
        throw new ValidationError(
          `Only ${nextAcademicYear} can be updated from this report`,
          { payload: { message: `Only ${nextAcademicYear} can be updated from this report` } }
        );
      }
    }

    const parsedIncreaseRate = toNullableNumber(editableIncreaseRate);

    if (
      editableIncreaseRate !== '' &&
      editableIncreaseRate !== null &&
      editableIncreaseRate !== undefined &&
      parsedIncreaseRate === null
    ) {
      await transaction.rollback();
      throw new ValidationError('Increase rate must be a valid number', {
        payload: { message: 'Increase rate must be a valid number' },
      });
    }

    if (parsedIncreaseRate !== null && parsedIncreaseRate < 0) {
      await transaction.rollback();
      throw new ValidationError('Increase rate must be zero or greater', {
        payload: { message: 'Increase rate must be zero or greater' },
      });
    }

    if (parsedIncreaseRate !== null && latestRate === null) {
      await transaction.rollback();
      throw new ValidationError(
        'Cannot calculate the next academic-year rate because the latest hourly rate is missing',
        {
          payload: {
            message:
              'Cannot calculate the next academic-year rate because the latest hourly rate is missing',
          },
        }
      );
    }

    const computedNextYearRate =
      parsedIncreaseRate !== null && latestRate !== null
        ? toRoundedNumber(latestRate + parsedIncreaseRate, 2)
        : null;

    const existing = await HourlyRateHistory.findOne({
      where: {
        lecturer_profile_id: lecturerProfile.id,
        academic_year: nextAcademicYear,
      },
      transaction,
    });

    if (computedNextYearRate === null) {
      if (String(remark || '').trim()) {
        if (existing) {
          await existing.update({ rate: null, remark: String(remark).trim() }, { transaction });
        } else {
          await HourlyRateHistory.create(
            {
              lecturer_profile_id: lecturerProfile.id,
              academic_year: nextAcademicYear,
              rate: null,
              remark: String(remark).trim(),
            },
            { transaction }
          );
        }
      } else if (existing) {
        await existing.destroy({ transaction });
      }
    } else {
      const payload = {
        rate: computedNextYearRate,
        remark: String(remark || '').trim() || null,
      };
      if (existing) {
        await existing.update(payload, { transaction });
      } else {
        await HourlyRateHistory.create(
          { lecturer_profile_id: lecturerProfile.id, academic_year: nextAcademicYear, ...payload },
          { transaction }
        );
      }
    }

    await transaction.commit();
    return { message: 'Rate hour data updated successfully.' };
  } catch (err) {
    if (transaction && !transaction.finished) {
      await transaction.rollback().catch(() => {});
    }
    throw err;
  }
}
