import { hoursFromMapping, normId, toBool } from '../../../utils/contractHelpers';

export function toDateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function toNumOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeStringList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  const text = value.trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item || '').trim()).filter(Boolean);
  } catch {
    // fall through
  }
  return [text];
}

export function extractTeachingCourses(contract) {
  const list = Array.isArray(contract?.courses) ? contract.courses : [];
  return list
    .map((course) => {
      const courseId = course?.course_id ?? course?.Course?.id ?? course?.Course?.course_id ?? null;
      const classId = course?.class_id ?? course?.Class?.id ?? null;
      const courseName = course?.course_name ?? course?.Course?.course_name ?? course?.Course?.name ?? '';
      return {
        course_id: courseId != null ? Number(courseId) : null,
        class_id: classId != null ? Number(classId) : null,
        course_name: String(courseName || ''),
        year_level: course?.year_level ?? contract?.year_level ?? null,
        term: course?.term ?? contract?.term ?? null,
        academic_year: course?.academic_year ?? contract?.academic_year ?? null,
        hours: course?.hours ?? course?.TeachingContractCourse?.hours ?? null,
      };
    })
    .filter((course) => course.course_id != null);
}

export function isAdvisorContract(contract) {
  return String(contract?.contract_type || '').toUpperCase() === 'ADVISOR';
}

export function toNullablePositiveInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Math.trunc(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function toNullableInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Math.trunc(Number(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeTeachingCoursesForApi(courseList = [], fallbackAcademicYear) {
  const list = Array.isArray(courseList) ? courseList : [];
  return list
    .map((course) => {
      const courseId = toNullablePositiveInt(course?.course_id ?? course?.Course?.id ?? course?.course?.id);
      if (!courseId) return null;
      return {
        course_id: courseId,
        class_id: toNullablePositiveInt(course?.class_id ?? course?.Class?.id ?? course?.class?.id),
        course_name: String(course?.course_name ?? course?.Course?.name ?? course?.course?.name ?? '').trim() || undefined,
        year_level: toNullablePositiveInt(course?.year_level),
        term: toNullableInt(course?.term),
        academic_year: String(course?.academic_year ?? fallbackAcademicYear ?? '').trim() || undefined,
        hours: toNullablePositiveInt(course?.hours),
      };
    })
    .filter(Boolean);
}

export function formatAxiosError(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const apiErrors = Array.isArray(data?.errors) ? data.errors : [];
  if (status === 400 && apiErrors.length) {
    const combined = apiErrors
      .map((item) => `${item?.path ? `${item.path}: ` : ''}${item?.message || ''}`.trim())
      .filter(Boolean)
      .join('\n');
    return combined || data?.message || 'Validation failed';
  }
  return data?.message || error?.message || 'Request failed';
}

export function courseKey(courseId, classId) {
  return `${normId(courseId) || ''}:${normId(classId) || ''}`;
}

export function buildSelectionState({ yearMappings, contract, contractLecturerId, mappingUserId }) {
  const courseList = Array.isArray(contract?.courses) ? contract.courses : [];
  const existingKeys = new Set(
    courseList.map((course) => courseKey(course?.course_id ?? course?.Course?.id ?? course?.Course?.course_id, course?.class_id ?? course?.Class?.id))
  );
  const selected = new Set();
  const combined = {};

  for (const mapping of yearMappings || []) {
    if (contractLecturerId && typeof mappingUserId === 'function') {
      const mappingLecturerId = mappingUserId(mapping);
      if (mappingLecturerId && mappingLecturerId !== contractLecturerId) continue;
    }
    const key = courseKey(mapping?.course?.id ?? mapping?.course_id, mapping?.class?.id ?? mapping?.class_id);
    if (!existingKeys.has(key)) continue;
    selected.add(mapping.id);

    const match = courseList.find((course) => (
      courseKey(course?.course_id ?? course?.Course?.id ?? course?.Course?.course_id, course?.class_id ?? course?.Class?.id) === key
    ));
    if (match?.theory_combined != null) combined[mapping.id] = toBool(match.theory_combined);
  }

  return { selected, combined };
}

export function buildSelectedCourses({ yearMappings, selectedMappingIds, contractLecturerId, mappingUserId, combineByMapping }) {
  return (yearMappings || [])
    .filter((mapping) => selectedMappingIds.has(mapping.id))
    .filter((mapping) => {
      if (!contractLecturerId || typeof mappingUserId !== 'function') return true;
      const mappingLecturerId = mappingUserId(mapping);
      return !mappingLecturerId || mappingLecturerId === contractLecturerId;
    })
    .map((mapping) => {
      const typeHours = String(mapping.type_hours || '');
      const theoryHours = String(mapping.theory_hours || '').toLowerCase();
      const is15h = theoryHours === '15h' || (!theoryHours && /15h/i.test(typeHours));
      const is30h = theoryHours === '30h' || (!theoryHours && /30h/i.test(typeHours));
      const theoryGroups = Number(mapping.theory_groups ?? mapping.groups_15h ?? mapping.groups_theory ?? mapping.group_count_theory ?? 0) || 0;
      const canCombineTheory = (is15h || is30h) && theoryGroups > 1;
      const theoryCombined = canCombineTheory ? !!(combineByMapping?.[mapping.id] ?? mapping.theory_combined) : false;
      return {
        course_id: mapping.course?.id,
        class_id: mapping.class?.id,
        course_name: mapping.course?.name,
        year_level: mapping.year_level,
        term: mapping.term,
        academic_year: mapping.academic_year,
        theory_combined: theoryCombined,
        hours: hoursFromMapping({ ...mapping, theory_combined: theoryCombined }),
      };
    });
}