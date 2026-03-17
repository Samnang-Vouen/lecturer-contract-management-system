import { hoursFromMapping, normId, toBool } from '../../../utils/contractHelpers';

export function mappingNaturalKey(mapping) {
  const courseId = normId(mapping?.course?.id);
  const classId = normId(mapping?.class?.id);
  const yearLevel = String(mapping?.year_level ?? '').trim();
  const term = String(mapping?.term ?? '').trim();
  const year = String(mapping?.academic_year ?? mapping?.class?.academic_year ?? '').trim();
  return `${courseId || ''}|${classId || ''}|${yearLevel}|${term}|${year}`;
}

export function dedupeByKey(rows, getKey) {
  const result = [];
  const seen = new Set();
  for (const row of rows || []) {
    const key = getKey(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }
  return result;
}

export function parseRateOrNull(value) {
  const parsed = parseFloat(String(value || '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildLecturerSelectedCoursesPayload({ mappings, dlgSelectedMappingIds, dlgCombineByMapping }) {
  return (mappings || []).map((mapping) => {
    if (!dlgSelectedMappingIds.has(mapping.id)) return null;
    const theoryCombined = dlgCombineByMapping?.[mapping.id] != null ? !!dlgCombineByMapping[mapping.id] : toBool(mapping.theory_combined);
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
  }).filter(Boolean);
}

export function parseStudentLine(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  const parts = text.split(',').map((value) => value.trim()).filter(Boolean);
  if (parts.length >= 2) return { student_name: parts.slice(0, -1).join(', '), student_code: parts[parts.length - 1] };
  return { student_name: text, student_code: '' };
}