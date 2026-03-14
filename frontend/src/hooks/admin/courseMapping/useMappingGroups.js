import { useMemo } from 'react';

/**
 * Derives groups data from the selected class and selected group IDs.
 */
export function useMappingGroups({ selectedClass, form, isEditMode }) {
  const groupsForSelectedClass = useMemo(() => {
    const raw = Array.isArray(selectedClass?.Groups)
      ? selectedClass.Groups
      : Array.isArray(selectedClass?.groups)
      ? selectedClass.groups
      : [];
    return raw
      .filter(Boolean)
      .map((g) => ({
        id: String(g.id),
        name: String(g.name || '').trim(),
        num_of_student: g.num_of_student,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedClass]);

  const assignedGroupIds = useMemo(() => {
    const th = Array.isArray(form.theory_group_ids) ? form.theory_group_ids : [];
    const lb = Array.isArray(form.lab_group_ids) ? form.lab_group_ids : [];
    return new Set([...th, ...lb].map(String));
  }, [form.theory_group_ids, form.lab_group_ids]);

  const assignedGroupsForEdit = useMemo(() => {
    if (!isEditMode) return [];
    if (!form.class_id) return [];
    if (!assignedGroupIds.size) return [];
    return groupsForSelectedClass.filter((g) => assignedGroupIds.has(String(g.id)));
  }, [assignedGroupIds, form.class_id, groupsForSelectedClass, isEditMode]);

  return {
    groupsForSelectedClass,
    assignedGroupIds,
    assignedGroupsForEdit,
  };
}
