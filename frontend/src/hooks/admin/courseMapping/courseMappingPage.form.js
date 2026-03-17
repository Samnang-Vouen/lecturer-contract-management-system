export function createInitialCourseMappingForm() {
  return {
    class_id: '',
    group_ids: [],
    theory_group_ids: [],
    lab_group_ids: [],
    theory_room_by_group: {},
    lab_room_by_group: {},
    course_id: '',
    lecturer_profile_id: '',
    academic_year: '',
    term: '',
    year_level: '',
    group_count: 1,
    type_hours: '',
    availability: '',
    availability_assignments_by_group: {},
    status: 'Pending',
    contacted_by: '',
    contactedBy: '',
    room_number: '',
    theory_room_number: '',
    lab_room_number: '',
    comment: '',
  };
}

function uniq(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map(String)));
}

export function buildEditForm(mapping) {
  const rowsForEdit = Array.isArray(mapping?._rowsForEdit) ? mapping._rowsForEdit : [];
  const hasGroupRows = rowsForEdit.some((row) => row?.group_id);
  const theoryGroupIds = [];
  const labGroupIds = [];
  const theoryRoomByGroup = {};
  const labRoomByGroup = {};

  if (hasGroupRows) {
    for (const row of rowsForEdit) {
      const groupId = row?.group_id ? String(row.group_id) : null;
      if (!groupId) continue;
      const theoryGroups = parseInt(String(row?.theory_groups ?? 0), 10) || 0;
      const labGroups = parseInt(String(row?.lab_groups ?? 0), 10) || 0;
      if (theoryGroups > 0) {
        theoryGroupIds.push(groupId);
        theoryRoomByGroup[groupId] = String(row?.theory_room_number || row?.room_number || row?.roomNumber || '').toUpperCase();
      }
      if (labGroups > 0) {
        labGroupIds.push(groupId);
        labRoomByGroup[groupId] = String(row?.lab_room_number || row?.room_number || row?.roomNumber || '').toUpperCase();
      }
    }
  }

  const availabilityAssignmentsByGroup = {};
  if (hasGroupRows) {
    for (const row of rowsForEdit) {
      const groupId = row?.group_id ? String(row.group_id) : null;
      if (!groupId) continue;
      const assignments = Array.isArray(row?.availability_assignments) ? row.availability_assignments : [];
      const theory = assignments.find((item) => String(item?.groupType || '').toUpperCase() === 'THEORY');
      const lab = assignments.find((item) => String(item?.groupType || '').toUpperCase() === 'LAB');
      availabilityAssignmentsByGroup[groupId] = {
        THEORY: (Array.isArray(theory?.assignedSessions) ? theory.assignedSessions : []).map((session) => ({ day: session?.day, sessionId: session?.session })),
        LAB: (Array.isArray(lab?.assignedSessions) ? lab.assignedSessions : []).map((session) => ({ day: session?.day, sessionId: session?.session })),
      };
    }
  }

  const theoryIds = uniq(theoryGroupIds);
  const labIds = uniq(labGroupIds);
  return {
    rowsForEdit,
    hasGroupRows,
    form: {
      class_id: mapping.class_id,
      group_ids: hasGroupRows ? Array.from(new Set([...theoryIds, ...labIds])) : mapping.group_id ? [String(mapping.group_id)] : [],
      theory_group_ids: hasGroupRows ? theoryIds : mapping.theory_groups > 0 && mapping.group_id ? [String(mapping.group_id)] : [],
      lab_group_ids: hasGroupRows ? labIds : mapping.lab_groups > 0 && mapping.group_id ? [String(mapping.group_id)] : [],
      theory_room_by_group: hasGroupRows ? theoryRoomByGroup : mapping.group_id ? { [String(mapping.group_id)]: String(mapping.theory_room_number || mapping.room_number || mapping.roomNumber || '').toUpperCase() } : {},
      lab_room_by_group: hasGroupRows ? labRoomByGroup : mapping.group_id ? { [String(mapping.group_id)]: String(mapping.lab_room_number || mapping.room_number || mapping.roomNumber || '').toUpperCase() } : {},
      course_id: mapping.course_id,
      lecturer_profile_id: mapping.lecturer_profile_id || '',
      academic_year: mapping.academic_year,
      term: mapping.term,
      year_level: mapping.year_level || '',
      group_count: mapping.group_count || 1,
      type_hours: mapping.type_hours,
      theory_hours: mapping.theory_hours || '',
      theory_groups: mapping.theory_groups ?? '',
      lab_hours: mapping.lab_hours || '',
      lab_groups: mapping.lab_groups ?? '',
      availability: mapping.availability || '',
      availability_assignments_by_group: availabilityAssignmentsByGroup,
      status: mapping.status,
      contacted_by: mapping.contacted_by || '',
      room_number: mapping.room_number || mapping.roomNumber || '',
      theory_room_number: mapping.theory_room_number || '',
      lab_room_number: mapping.lab_room_number || '',
      comment: mapping.comment || '',
    },
    teachingTypeMapping: {
      ...mapping,
      theory_groups: Number.isFinite(mapping?._theoryCount) ? mapping._theoryCount : mapping.theory_groups,
      lab_groups: Number.isFinite(mapping?._labCount) ? mapping._labCount : mapping.lab_groups,
      theory_hours: mapping?._theoryHour || mapping.theory_hours,
    },
  };
}