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

    const thIds = Array.isArray(form.theory_group_ids) ? form.theory_group_ids.map(String) : [];
    const lbIds = Array.isArray(form.lab_group_ids) ? form.lab_group_ids.map(String) : [];
    const hasGroupTargets = thIds.length > 0 || lbIds.length > 0;
    const theoryHours = String(form.theory_hours || '').trim().toLowerCase() === '30h' ? '30h' : '15h';
    const assignments =
      form.availability_assignments_by_group && typeof form.availability_assignments_by_group === 'object'
        ? form.availability_assignments_by_group
        : {};

    if (hasGroupTargets) {
      // Per-group requirements + global uniqueness
      const slotToOwner = new Map(); // slotKey -> { type: 'THEORY'|'LAB', gid }

      for (const gid of thIds) {
        const list = assignments?.[gid]?.THEORY;
        const sessions = Array.isArray(list) ? list : [];
        const min = 1;
        const max = theoryHours === '30h' ? 2 : 1;
        if (sessions.length < min || sessions.length > max) {
          const gName = groupsForSelectedClass?.find?.((x) => String(x.id) === String(gid))?.name;
          errs.push(
            `Theory availability is required for ${gName || `Group #${gid}`} (select ${min === max ? `exactly ${min}` : `${min}–${max}`} sessions).`
          );
        }
        sessions.forEach((s) => {
          const day = String(s?.day || '').trim();
          const sessionId = String(s?.sessionId || s?.session || '').trim().toUpperCase();
          if (!day || !sessionId) return;
          const key = `${day}|${sessionId}`;
          const prev = slotToOwner.get(key);
          if (prev) {
            if (prev.type === 'LAB') {
              errs.push('A session cannot be assigned to more than one group.');
              return;
            }
            // THEORY vs THEORY: allow overlap only for Theory 15h
            if (theoryHours !== '15h') {
              errs.push('A session cannot be assigned to more than one group.');
              return;
            }
          }
          slotToOwner.set(key, { type: 'THEORY', gid });
        });
      }

      for (const gid of lbIds) {
        const list = assignments?.[gid]?.LAB;
        const sessions = Array.isArray(list) ? list : [];
        if (sessions.length !== 2) {
          const gName = groupsForSelectedClass?.find?.((x) => String(x.id) === String(gid))?.name;
          errs.push(`Lab availability is required for ${gName || `Group #${gid}`} (select exactly 2 sessions).`);
        }
        sessions.forEach((s) => {
          const day = String(s?.day || '').trim();
          const sessionId = String(s?.sessionId || s?.session || '').trim().toUpperCase();
          if (!day || !sessionId) return;
          const key = `${day}|${sessionId}`;
          const prev = slotToOwner.get(key);
          if (prev) errs.push('A session cannot be assigned to more than one group.');
          slotToOwner.set(key, { type: 'LAB', gid });
        });
      }
    } else {
      if (!String(form.availability || '').trim()) errs.push('Availability is required.');
    }

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
        if (hasGroups) {
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
        } else {
          if (!String(form.theory_room_number || '').trim()) errs.push('Theory Room is required.');
        }
      }
    }

    if (teachingType?.labSelected) {
      if (hasClass) {
        if (hasGroups) {
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
        } else {
          if (!String(form.lab_room_number || '').trim()) errs.push('Lab Room is required.');
        }
      }
    }

    return errs;
  }, [
    form.academic_year,
    form.availability,
    form.availability_assignments_by_group,
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
