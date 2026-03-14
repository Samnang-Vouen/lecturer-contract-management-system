import { useCallback, useEffect, useState } from 'react';

/**
 * Client-side validation + alert behavior for MappingFormDialog.
 * Keeps existing state names/handler signatures; returns helper APIs.
 */
export function useMappingValidation({ isOpen, isEditMode, form, groupsForSelectedClass, teachingType, onSubmit }) {
  const [clientErrors, setClientErrors] = useState([]);

  useEffect(() => {
    if (!isOpen) setClientErrors([]);
  }, [isOpen]);

  const validateBeforeSubmit = useCallback(() => {
    const errs = [];

    if (!form.availability) errs.push('Availability is required.');

    if (!isEditMode) {
      if (!form.academic_year) errs.push('Academic Year is required.');
      if (!form.year_level) errs.push('Year Level is required.');
      if (!form.term) errs.push('Term is required.');
      if (!form.class_id) errs.push('Class is required.');
      if (!form.course_id) errs.push('Course is required.');
      if (!form.lecturer_profile_id) errs.push('Lecturer is required.');
    }

    const typeSelected = !!(teachingType?.theorySelected || teachingType?.labSelected);
    if (!typeSelected) errs.push('Select at least one Teaching Type (Theory or Lab).');

    const hasGroups = Array.isArray(groupsForSelectedClass) && groupsForSelectedClass.length > 0;
    const hasClass = !!form.class_id;

    if (teachingType?.theorySelected) {
      if (!teachingType?.theoryHour) errs.push('Select Theory hours (15h or 30h).');

      if (hasClass) {
        if (!isEditMode && hasGroups) {
          const thIds = Array.isArray(form.theory_group_ids) ? form.theory_group_ids.map(String) : [];
          if (thIds.length === 0) errs.push('Select at least one Theory group.');
          const thRoomMap =
            form.theory_room_by_group && typeof form.theory_room_by_group === 'object' ? form.theory_room_by_group : {};
          thIds.forEach((gid) => {
            if (!String(thRoomMap[String(gid)] || '').trim()) {
              const gName = groupsForSelectedClass.find((x) => String(x.id) === String(gid))?.name;
              errs.push(`Theory room is required for ${gName || `Group #${gid}`}.`);
            }
          });
        } else if (!isEditMode) {
          if (!String(form.theory_room_number || '').trim()) errs.push('Theory Room is required.');
        }
      }
    }

    if (teachingType?.labSelected) {
      if (hasClass) {
        if (!isEditMode && hasGroups) {
          const lbIds = Array.isArray(form.lab_group_ids) ? form.lab_group_ids.map(String) : [];
          if (lbIds.length === 0) errs.push('Select at least one Lab group.');
          const lbRoomMap =
            form.lab_room_by_group && typeof form.lab_room_by_group === 'object' ? form.lab_room_by_group : {};
          lbIds.forEach((gid) => {
            if (!String(lbRoomMap[String(gid)] || '').trim()) {
              const gName = groupsForSelectedClass.find((x) => String(x.id) === String(gid))?.name;
              errs.push(`Lab room is required for ${gName || `Group #${gid}`}.`);
            }
          });
        } else if (!isEditMode) {
          if (!String(form.lab_room_number || '').trim()) errs.push('Lab Room is required.');
        }
      }
    }

    return errs;
  }, [
    form.academic_year,
    form.availability,
    form.class_id,
    form.course_id,
    form.lab_group_ids,
    form.lab_room_by_group,
    form.lab_room_number,
    form.lecturer_profile_id,
    form.term,
    form.theory_group_ids,
    form.theory_room_by_group,
    form.theory_room_number,
    form.year_level,
    groupsForSelectedClass,
    isEditMode,
    teachingType,
  ]);

  const handleSubmit = useCallback(() => {
    const errs = validateBeforeSubmit();
    if (errs.length) {
      setClientErrors(errs);
      return;
    }

    setClientErrors([]);
    const payload = teachingType?.buildPayload?.() || { isValid: false };
    if (!payload.isValid) {
      setClientErrors(['Please complete Teaching Type details before submitting.']);
      return;
    }

    onSubmit(payload);
  }, [onSubmit, teachingType, validateBeforeSubmit]);

  // Live-update the alert as the user fixes fields
  useEffect(() => {
    if (!isOpen) return;
    if (clientErrors.length === 0) return;
    const next = validateBeforeSubmit();
    const prevKey = clientErrors.join('\n');
    const nextKey = next.join('\n');
    if (prevKey !== nextKey) setClientErrors(next);
  }, [clientErrors, isOpen, validateBeforeSubmit]);

  return {
    clientErrors,
    setClientErrors,
    validateBeforeSubmit,
    handleSubmit,
  };
}
