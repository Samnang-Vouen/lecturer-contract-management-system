export function normalizeSearchText(value) {
  return String(value || '').toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
}

export function stripHonorific(value) {
  const titles = '(mr|mrs|ms|miss|dr|prof|professor)';
  return String(value || '').replace(new RegExp(`^${titles}\\s+`, 'i'), '').trim();
}

export function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '_');
}

export function deriveAdvisorContractStatus(contract) {
  const rawStatus = normalizeStatus(contract?.status || '');
  const hasAdvisorSignature = !!contract?.advisor_signed_at;
  const hasManagementSignature = !!contract?.management_signed_at;
  const endDate = contract?.end_date || contract?.endDate;
  const contractEnded = (() => {
    if (!endDate) return false;
    try {
      const date = new Date(endDate);
      if (Number.isNaN(date.getTime())) return false;
      const today = new Date();
      date.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return date <= today;
    } catch {
      return false;
    }
  })();

  if (rawStatus === 'CONTRACT_ENDED' || contractEnded) return 'CONTRACT_ENDED';
  if (rawStatus === 'REQUEST_REDO') return 'REQUEST_REDO';
  if (rawStatus === 'COMPLETED' || (hasAdvisorSignature && hasManagementSignature)) return 'COMPLETED';
  if (rawStatus === 'WAITING_MANAGEMENT' || (hasAdvisorSignature && !hasManagementSignature)) return 'WAITING_MANAGEMENT';
  return 'WAITING_ADVISOR';
}

export function normalizeAdvisorContract(contract) {
  return {
    ...(contract || {}),
    contract_type: 'ADVISOR',
    status: deriveAdvisorContractStatus(contract || {}),
  };
}

export function parseIntSafe(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export function parseFloatSafe(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') return defaultValue;
  const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export function extractNumber(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') return defaultValue;
  if (typeof value === 'number') return value;
  const match = String(value).match(/\d+/);
  return match ? parseInt(match[0], 10) : defaultValue;
}

export function buildTeachingContractPayload(payload, academicYear) {
  const cleanedCourses = (payload.courses || []).map((course) => ({
    course_id: parseIntSafe(course.course_id),
    class_id: parseIntSafe(course.class_id),
    course_name: course.course_name || '',
    year_level: extractNumber(course.year_level),
    term: extractNumber(course.term),
    academic_year: course.academic_year || academicYear,
    hours: parseIntSafe(course.hours),
  }));

  return {
    lecturer_user_id: parseIntSafe(payload.lecturerId),
    academic_year: academicYear,
    term: extractNumber(payload.courses?.[0]?.term, 1),
    year_level: extractNumber(payload.courses?.[0]?.year_level),
    start_date: payload.start_date,
    end_date: payload.end_date,
    courses: cleanedCourses,
    items: payload.items,
  };
}

export function buildAdvisorContractPayload(payload, academicYear) {
  return {
    lecturer_user_id: parseIntSafe(payload.lecturerId),
    academic_year: academicYear,
    role: payload.role,
    hourly_rate: parseFloatSafe(payload.hourlyRate),
    capstone_1: !!payload.capstone_1,
    capstone_2: !!payload.capstone_2,
    internship_1: !!payload.internship_1,
    internship_2: !!payload.internship_2,
    hours_per_student: parseIntSafe(payload.hours_per_student),
    students: Array.isArray(payload.students) ? payload.students : [],
    start_date: payload.start_date,
    end_date: payload.end_date,
    duties: Array.isArray(payload.duties) ? payload.duties : [],
    join_judging_hours: payload.join_judging_hours === '' ? null : parseIntSafe(payload.join_judging_hours),
  };
}