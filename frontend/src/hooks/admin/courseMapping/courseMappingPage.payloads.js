function toPositiveIntList(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => parseInt(String(value), 10))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function sanitizeRoomMap(groupIds, roomMap) {
  const selected = new Set(toPositiveIntList(groupIds).map(String));
  const output = {};
  for (const groupId of selected) {
    const sanitized = String(roomMap?.[groupId] || '').trim().slice(0, 50).toUpperCase();
    if (sanitized) output[groupId] = sanitized;
  }
  return output;
}

export function validateAvailabilityAssignments(form) {
  const assignments = form.availability_assignments_by_group && typeof form.availability_assignments_by_group === 'object' ? form.availability_assignments_by_group : {};
  const theorySet = new Set((Array.isArray(form.theory_group_ids) ? form.theory_group_ids : []).map(String));
  const labSet = new Set((Array.isArray(form.lab_group_ids) ? form.lab_group_ids : []).map(String));
  const theoryHours = String(form.theory_hours || '').trim().toLowerCase() === '30h' ? '30h' : '15h';
  const errors = [];
  const used = new Map();

  const consume = (groupId, typeLabel, sessions) => {
    const local = new Set();
    for (const session of Array.isArray(sessions) ? sessions : []) {
      const day = String(session?.day || '').trim();
      const sessionId = String(session?.sessionId || session?.session || '').trim().toUpperCase();
      if (!day || !sessionId) continue;
      const key = `${day}|${sessionId}`;
      if (local.has(key)) continue;
      local.add(key);
      const previous = used.get(key);
      if (typeLabel === 'Theory') {
        if (previous && (previous.type === 'LAB' || theoryHours !== '15h')) errors.push(`Session ${day} ${sessionId} is assigned to more than one group.`);
        else if (!previous) used.set(key, { type: 'THEORY', gid: groupId });
      } else {
        if (previous) errors.push(`Session ${day} ${sessionId} is assigned to more than one group.`);
        used.set(key, { type: 'LAB', gid: groupId });
      }
    }
  };

  for (const groupId of theorySet) {
    const theory = assignments?.[groupId]?.THEORY || assignments?.[groupId]?.theory || [];
    const count = Array.isArray(theory) ? theory.length : 0;
    if (theoryHours === '30h' ? count < 1 || count > 2 : count !== 1) errors.push(`Theory Group ${groupId}: ${theoryHours === '30h' ? 'select 1–2 sessions.' : 'select exactly 1 session.'}`);
    consume(groupId, 'Theory', theory);
  }

  for (const groupId of labSet) {
    const lab = assignments?.[groupId]?.LAB || assignments?.[groupId]?.lab || [];
    if ((Array.isArray(lab) ? lab.length : 0) !== 2) errors.push(`Lab Group ${groupId}: select exactly 2 sessions.`);
    consume(groupId, 'Lab', lab);
  }

  return errors;
}

export function buildAddPayload(form, teachingPayload) {
  return {
    ...form,
    ...teachingPayload,
    availability_assignments_by_group: form.availability_assignments_by_group || {},
    theory_group_ids: toPositiveIntList(form.theory_group_ids),
    lab_group_ids: toPositiveIntList(form.lab_group_ids),
    group_ids: Array.from(new Set([...toPositiveIntList(form.theory_group_ids), ...toPositiveIntList(form.lab_group_ids)])),
    theory_room_by_group: sanitizeRoomMap(form.theory_group_ids, form.theory_room_by_group),
    lab_room_by_group: sanitizeRoomMap(form.lab_group_ids, form.lab_room_by_group),
    course_id: form.course_id ? parseInt(form.course_id, 10) : '',
    comment: String(form.comment || '').slice(0, 160),
    contacted_by: form.contactedBy || form.contacted_by || '',
    room_number: String(form.room_number || '').toUpperCase(),
    theory_room_number: String(form.theory_room_number || '').toUpperCase(),
    lab_room_number: String(form.lab_room_number || '').toUpperCase(),
  };
}

export function buildEditPayload(editing, form, teachingPayload) {
  const rowsForEdit = Array.isArray(editing?._rowsForEdit) ? editing._rowsForEdit : [];
  const isGroupMode = rowsForEdit.some((row) => row?.group_id);
  const assignments = form.availability_assignments_by_group && typeof form.availability_assignments_by_group === 'object' ? form.availability_assignments_by_group : {};
  const hasAssignedSessions = Object.values(assignments).some((value) => {
    const theory = Array.isArray(value?.THEORY) ? value.THEORY : Array.isArray(value?.theory) ? value.theory : [];
    const lab = Array.isArray(value?.LAB) ? value.LAB : Array.isArray(value?.lab) ? value.lab : [];
    return theory.length > 0 || lab.length > 0;
  });
  const hadAssignedSessions = rowsForEdit.some((row) => Array.isArray(row?.availability_assignments) && row.availability_assignments.length > 0);

  const payload = {
    lecturer_profile_id: form.lecturer_profile_id,
    status: form.status,
    contacted_by: form.contacted_by,
    comment: String(form.comment || '').slice(0, 160),
    ...teachingPayload,
  };

  if (!isGroupMode) {
    payload.room_number = String(form.room_number || '').toUpperCase();
    payload.theory_room_number = String(form.theory_room_number || '').toUpperCase();
    payload.lab_room_number = String(form.lab_room_number || '').toUpperCase();
    payload.availability = form.availability || '';
    return payload;
  }

  payload.theory_room_by_group = sanitizeRoomMap(form.theory_group_ids, form.theory_room_by_group);
  payload.lab_room_by_group = sanitizeRoomMap(form.lab_group_ids, form.lab_room_by_group);
  if (hasAssignedSessions) payload.availability_assignments_by_group = assignments;
  else if (hadAssignedSessions) {
    payload.availability_assignments_by_group = {};
    payload.availability = null;
  } else {
    payload.availability = form.availability || '';
  }
  return payload;
}