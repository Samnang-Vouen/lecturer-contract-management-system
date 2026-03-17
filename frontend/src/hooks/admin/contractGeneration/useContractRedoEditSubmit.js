import { useState } from 'react';
import {
  buildSelectedCourses,
  courseKey,
  formatAxiosError,
  normalizeStringList,
  normalizeTeachingCoursesForApi,
  toNullableInt,
  toNullablePositiveInt,
  toNumOrNull,
} from './contractRedoEdit.helpers';

export function useContractRedoEditSubmit({
  advisor,
  contract,
  onSave,
  onOpenChange,
  startDate,
  endDate,
  role,
  hourlyRate,
  capstone1,
  capstone2,
  internship1,
  internship2,
  hoursPerStudent,
  joinJudgingHours,
  students,
  duties,
  items,
  courses,
  yearMappings,
  selectedMappingIds,
  combineByMapping,
  contractLecturerId,
  mappingUserId,
  canSelectFromMappings,
  effectiveTeachYear,
}) {
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!contract?.id) return;
    const nextErrors = {};
    setSubmitError('');

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) nextErrors.endDate = 'End date must be after start date';
    }

    if (advisor) {
      const dutyList = normalizeStringList(duties);
      const studentList = Array.isArray(students) ? students : [];
      if (!role) nextErrors.role = 'Role is required';
      if (!dutyList.length) nextErrors.duties = 'Please add at least one duty';
      if (!studentList.length) nextErrors.students = 'Please add at least one student';
      if (studentList.some((student) => !String(student?.student_name || '').trim() || !String(student?.project_title || '').trim() || !String(student?.company_name || '').trim())) {
        nextErrors.students = 'Each student must include name, project title, and company name';
      }
      if (!(capstone1 || capstone2 || internship1 || internship2)) nextErrors.responsibilities = 'Select at least one responsibility';
      if (toNumOrNull(hoursPerStudent) == null) nextErrors.hoursPerStudent = 'Hours per student is required';
      if (toNumOrNull(hourlyRate) == null) nextErrors.hourlyRate = 'Hourly rate is required';
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;

      const payload = {
        role,
        hourly_rate: toNumOrNull(hourlyRate),
        capstone_1: !!capstone1,
        capstone_2: !!capstone2,
        internship_1: !!internship1,
        internship_2: !!internship2,
        hours_per_student: (() => {
          const parsed = parseInt(String(hoursPerStudent), 10);
          return Number.isFinite(parsed) ? parsed : null;
        })(),
        students: studentList,
        start_date: startDate || null,
        end_date: endDate || null,
        duties: dutyList,
        join_judging_hours: String(joinJudgingHours || '').trim() ? parseInt(String(joinJudgingHours), 10) : null,
      };

      setSaving(true);
      try {
        await onSave?.(contract, payload);
        onOpenChange(false);
      } catch (error) {
        setSubmitError(formatAxiosError(error));
      } finally {
        setSaving(false);
      }
      return;
    }

    const itemList = normalizeStringList(items);
    if (!itemList.length) nextErrors.items = 'Please add at least one duty';

    const existingCourses = Array.isArray(courses) ? courses : [];
    let nextCourseList = existingCourses;
    let derivedTerm = contract?.term ?? null;
    let derivedYearLevel = contract?.year_level ?? null;

    if (canSelectFromMappings) {
      const selectedCoursesPayload = buildSelectedCourses({ yearMappings, selectedMappingIds, contractLecturerId, mappingUserId, combineByMapping });
      const selectedKeys = new Set(selectedCoursesPayload.map((course) => courseKey(course.course_id, course.class_id)));
      const preserved = existingCourses.filter((course) => !selectedKeys.has(courseKey(course.course_id, course.class_id)));
      nextCourseList = [...selectedCoursesPayload, ...preserved];
      const firstCourse = selectedCoursesPayload[0] || preserved[0] || null;
      if (firstCourse?.term != null) derivedTerm = firstCourse.term;
      if (firstCourse?.year_level != null) derivedYearLevel = firstCourse.year_level;
    }

    const normalizedCourses = normalizeTeachingCoursesForApi(nextCourseList, effectiveTeachYear);
    if (!normalizedCourses.length) nextErrors.courses = 'Please select at least one course';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      ...(effectiveTeachYear ? { academic_year: effectiveTeachYear } : {}),
      ...(toNullableInt(derivedTerm) != null ? { term: toNullableInt(derivedTerm) } : {}),
      ...(toNullablePositiveInt(derivedYearLevel) != null ? { year_level: toNullablePositiveInt(derivedYearLevel) } : {}),
      start_date: startDate || null,
      end_date: endDate || null,
      items: itemList,
      ...(normalizedCourses.length ? { courses: normalizedCourses } : {}),
    };

    setSaving(true);
    try {
      await onSave?.(contract, payload);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(formatAxiosError(error));
    } finally {
      setSaving(false);
    }
  };

  return {
    errors,
    setErrors,
    submitError,
    saving,
    canSubmit: !!contract?.id && !saving,
    handleSubmit,
  };
}