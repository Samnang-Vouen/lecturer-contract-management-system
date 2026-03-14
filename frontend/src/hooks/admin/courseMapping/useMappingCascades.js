import { useMemo } from 'react';

/**
 * Derives selection options for the add flow.
 * Keeps existing logic/behavior from MappingFormDialog.
 */
export function useMappingCascades({ form, classes, courses, lecturers, classMap, courseMap }) {
  const yearLevelOptionsForAY = useMemo(() => {
    if (!form.academic_year) return [];
    const set = new Set();
    (Array.isArray(classes) ? classes : []).forEach((c) => {
      if (String(c.academic_year) === String(form.academic_year) && (c.year_level || c.yearLevel)) {
        set.add(String(c.year_level ?? c.yearLevel));
      }
    });
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [classes, form.academic_year]);

  const termOptionsForAYLevel = useMemo(() => {
    if (!form.academic_year || !form.year_level) return [];
    const set = new Set();
    (Array.isArray(classes) ? classes : []).forEach((c) => {
      const yl = c.year_level ?? c.yearLevel;
      if (String(c.academic_year) === String(form.academic_year) && String(yl) === String(form.year_level) && c.term) {
        set.add(String(c.term));
      }
    });
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [classes, form.academic_year, form.year_level]);

  const classesForSelection = useMemo(() => {
    if (!form.academic_year || !form.year_level || !form.term) return [];
    return (Array.isArray(classes) ? classes : []).filter(
      (c) =>
        String(c.academic_year) === String(form.academic_year) &&
        String(c.year_level ?? c.yearLevel) === String(form.year_level) &&
        String(c.term) === String(form.term)
    );
  }, [classes, form.academic_year, form.year_level, form.term]);

  const allowedCourses = useMemo(() => {
    if (!form.class_id) return courses;
    const cls = (Array.isArray(classes) ? classes : []).find((c) => c.id == form.class_id);
    let allowed = courses;
    if (cls && Array.isArray(cls.courses) && cls.courses.length) {
      const codes = new Set(
        cls.courses
          .map((x) => (typeof x === 'string' ? x : x.course_code || x.code || x.courseCode || null))
          .filter(Boolean)
      );
      if (codes.size) allowed = (Array.isArray(courses) ? courses : []).filter((c) => codes.has(c.course_code));
    }
    return allowed;
  }, [form.class_id, classes, courses]);

  const filteredLecturers = useMemo(() => {
    if (!form.course_id) return [];
    return (Array.isArray(lecturers) ? lecturers : []).filter((l) =>
      Array.isArray(l.courses) &&
      l.courses.some(
        (cc) =>
          String(cc.id) === String(form.course_id) ||
          String(cc.course_code) === String(courseMap?.[form.course_id]?.course_code || '')
      )
    );
  }, [form.course_id, lecturers, courseMap]);

  const selectedClass = useMemo(() => {
    if (!form.class_id) return null;
    return (
      (classMap && classMap[form.class_id]) ||
      (Array.isArray(classes) ? classes : []).find((c) => String(c.id) === String(form.class_id)) ||
      null
    );
  }, [classes, classMap, form.class_id]);

  return {
    yearLevelOptionsForAY,
    termOptionsForAYLevel,
    classesForSelection,
    allowedCourses,
    filteredLecturers,
    selectedClass,
  };
}
