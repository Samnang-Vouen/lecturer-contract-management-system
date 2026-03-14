import { useEffect } from 'react';

/**
 * Keeps teachingType's internal group counts in sync with selected group IDs.
 * Also provides a safe fallback for legacy/no-group classes by forcing count to '1'.
 */
export function useTeachingTypeGroupSync({ isOpen, teachingType, groupsForSelectedClass, form }) {
  useEffect(() => {
    if (!isOpen) return;
    if (!teachingType) return;

    const hasGroups = Array.isArray(groupsForSelectedClass) && groupsForSelectedClass.length > 0;

    if (teachingType.theorySelected) {
      const theorySelectedCount = Array.isArray(form.theory_group_ids) ? form.theory_group_ids.length : 0;
      const next = hasGroups ? String(theorySelectedCount) : '1';
      if (String(teachingType.theoryGroups || '') !== next) teachingType.setTheoryGroups?.(next);
    } else {
      if (String(teachingType.theoryGroups || '') !== '') teachingType.setTheoryGroups?.('');
    }

    if (teachingType.labSelected) {
      const labSelectedCount = Array.isArray(form.lab_group_ids) ? form.lab_group_ids.length : 0;
      const next = hasGroups ? String(labSelectedCount) : '1';
      if (String(teachingType.labGroups || '') !== next) teachingType.setLabGroups?.(next);
    } else {
      if (String(teachingType.labGroups || '') !== '') teachingType.setLabGroups?.('');
    }
  }, [
    form.lab_group_ids,
    form.theory_group_ids,
    groupsForSelectedClass,
    isOpen,
    teachingType,
    form,
  ]);
}
