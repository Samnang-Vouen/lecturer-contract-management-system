import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import ExcelJS from 'exceljs';
import CourseMapping from '../model/courseMapping.model.js';
import ClassModel from '../model/class.model.js';
import Course from '../model/course.model.js';
import { LecturerProfile, Department } from '../model/index.js';
import Specialization from '../model/specialization.model.js';
import Group from '../model/group.model.js';
import Schedule from '../model/schedule.model.js';
import ScheduleEntry from '../model/scheduleEntry.model.js';
import { TimeSlot } from '../model/timeSlot.model.js';
import {
  availabilityToScheduleEntries,
  buildAvailabilityStringFromSessions,
  normalizeDay,
  normalizeSession,
  SESSION_TO_RANGE,
} from '../utils/availabilityParser.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function resolveDeptId({ role, department_name }) {
  if (role === 'admin' && department_name) {
    const dept = await Department.findOne({ where: { dept_name: department_name } });
    return dept ? dept.id : null;
  }
  return null;
}

function isAcceptedStatus(status) {
  return String(status || '').trim().toLowerCase() === 'accepted';
}

function startDateFromAcademicYear(academicYear) {
  const m = String(academicYear || '').match(/(\d{4})\s*-\s*(\d{4})/);
  return m ? `${m[1]}-10-01` : null;
}

function parseAvailabilityAssignments(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseGroupNumberFromName(name, fallback) {
  const n = parseInt(String(name || '').match(/(\d+)/)?.[1] || '', 10);
  if (Number.isInteger(n) && n > 0) return n;
  const fb = parseInt(String(fallback || ''), 10);
  return Number.isInteger(fb) && fb > 0 ? fb : 1;
}

function normalizeAssignmentsByGroup(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [gid, val] of Object.entries(raw)) {
    const groupId = parseInt(String(gid), 10);
    if (!Number.isInteger(groupId) || groupId <= 0) continue;
    const th = Array.isArray(val?.THEORY) ? val.THEORY : Array.isArray(val?.theory) ? val.theory : [];
    const lb = Array.isArray(val?.LAB) ? val.LAB : Array.isArray(val?.lab) ? val.lab : [];
    out[String(groupId)] = {
      THEORY: th.map((x) => ({ day: x?.day, session: x?.session || x?.sessionId }))
               .filter((x) => normalizeDay(x.day) && normalizeSession(x.session)),
      LAB: lb.map((x) => ({ day: x?.day, session: x?.session || x?.sessionId }))
             .filter((x) => normalizeDay(x.day) && normalizeSession(x.session)),
    };
  }
  return out;
}

function sanitizeRoomMap(raw, allowNull = false) {
  if (!raw || typeof raw !== 'object') return allowNull ? null : {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    const gid = parseInt(String(k), 10);
    if (!Number.isInteger(gid) || gid <= 0) continue;
    if (allowNull && v === null) { out[String(gid)] = null; continue; }
    const san = String(v || '').trim().slice(0, 50).toUpperCase();
    if (!san && !allowNull) continue;
    out[String(gid)] = san || null;
  }
  return out;
}

async function syncScheduleForCourseMapping(mappingId, cachedTimeSlotMap = null) {
  const mapping = await CourseMapping.findByPk(mappingId, {
    include: [
      { model: Group, attributes: ['id', 'name'] },
      { model: Course, attributes: ['id', 'course_name'] },
    ],
  });

  const isEligible =
    mapping && mapping.group_id && mapping.availability && isAcceptedStatus(mapping.status);

  if (!isEligible) {
    await ScheduleEntry.destroy({ where: { course_mapping_id: mappingId } });
    return;
  }

  const slots = await availabilityToScheduleEntries(mapping.availability, TimeSlot);
  if (!slots.length) {
    await ScheduleEntry.destroy({ where: { course_mapping_id: mappingId } });
    return;
  }

  const t = await sequelize.transaction();
  try {
    const scheduleName = [
      mapping.Group?.name || `Group ${mapping.group_id}`,
      mapping.term || null,
      mapping.academic_year || null,
    ].filter(Boolean).join(' - ');

    const [schedule] = await Schedule.findOrCreate({
      where: { group_id: mapping.group_id },
      defaults: {
        group_id: mapping.group_id,
        name: scheduleName || `Schedule for Group ${mapping.group_id}`,
        notes: 'Auto-generated from accepted course mappings',
        start_date: startDateFromAcademicYear(mapping.academic_year),
      },
      transaction: t,
    });

    const timeSlotMap = cachedTimeSlotMap ||
      new Map(
        (await TimeSlot.findAll({ attributes: ['id', 'label'], transaction: t }))
          .map((ts) => [ts.label, ts.id])
      );

    const structuredAssignments = parseAvailabilityAssignments(mapping.availability_assignments);
    const structuredEntries = structuredAssignments.flatMap((assignment) => {
      const rawType = String(assignment?.groupType || '').trim().toUpperCase();
      const sessionType = rawType === 'LAB' ? 'Lab' : rawType === 'THEORY' ? 'Theory' : null;
      if (!sessionType) return [];
      const room =
        sessionType === 'Lab'
          ? mapping.lab_room_number || mapping.room_number || mapping.theory_room_number || 'TBA'
          : mapping.theory_room_number || mapping.room_number || mapping.lab_room_number || 'TBA';
      return (Array.isArray(assignment?.assignedSessions) ? assignment.assignedSessions : []).flatMap((assigned) => {
        const day = normalizeDay(assigned?.day);
        const session = normalizeSession(assigned?.session || assigned?.sessionId);
        const timeSlotLabel = session ? SESSION_TO_RANGE[session]?.timeSlot : null;
        const timeSlotId = timeSlotLabel ? timeSlotMap.get(timeSlotLabel) : null;
        if (!day || !timeSlotId) return [];
        return [{ schedule_id: schedule.id, course_mapping_id: mapping.id, day_of_week: day, time_slot_id: timeSlotId, room, session_type: sessionType }];
      });
    });

    const fallbackSessionType =
      (mapping.lab_groups || 0) > 0 && (mapping.theory_groups || 0) === 0 ? 'Lab' : 'Theory';
    const fallbackRoom =
      fallbackSessionType === 'Lab'
        ? mapping.lab_room_number || mapping.room_number || mapping.theory_room_number || 'TBA'
        : mapping.theory_room_number || mapping.room_number || mapping.lab_room_number || 'TBA';

    const upsertEntries = structuredEntries.length > 0
      ? structuredEntries
      : slots.map((slot) => ({
          schedule_id: schedule.id,
          course_mapping_id: mapping.id,
          day_of_week: slot.day_of_week,
          time_slot_id: slot.time_slot_id,
          room: fallbackRoom,
          session_type: fallbackSessionType,
        }));

    if (upsertEntries.length > 0) {
      await ScheduleEntry.destroy({
        where: { course_mapping_id: mapping.id, schedule_id: schedule.id },
        transaction: t,
      });
      await ScheduleEntry.bulkCreate(upsertEntries, { transaction: t });
    }

    const currentSlotKeys = upsertEntries.map((s) => `${s.day_of_week}__${s.time_slot_id}`);
    const existingEntries = await ScheduleEntry.findAll({
      where: { course_mapping_id: mapping.id, schedule_id: schedule.id },
      attributes: ['id', 'day_of_week', 'time_slot_id'],
      transaction: t,
    });
    const staleIds = existingEntries
      .filter((e) => !currentSlotKeys.includes(`${e.day_of_week}__${e.time_slot_id}`))
      .map((e) => e.id);
    if (staleIds.length) {
      await ScheduleEntry.destroy({ where: { id: { [Op.in]: staleIds } }, transaction: t });
    }

    await t.commit();
  } catch (err) {
    await t.rollback();
    console.error(`[syncScheduleForCourseMapping] Transaction failed for mapping ${mappingId}:`, err);
    throw err;
  }
}

function serializeMapping(r) {
  const thGroups = Number.isFinite(r.theory_groups) ? r.theory_groups : null;
  const lbGroups = Number.isFinite(r.lab_groups) ? r.lab_groups : null;
  const type = String(r.type_hours || '').toLowerCase();
  const isTheoryLegacy = type.includes('theory') || type.includes('15h');
  const isLabLegacy = type.includes('lab') || type.includes('30h');
  const theory_groups = thGroups !== null ? thGroups : isTheoryLegacy ? r.group_count || 0 : 0;
  const lab_groups = lbGroups !== null ? lbGroups : isLabLegacy ? r.group_count || 0 : 0;
  return {
    id: r.id,
    class_id: r.class_id,
    group_id: r.group_id ?? null,
    course_id: r.course_id,
    lecturer_profile_id: r.lecturer_profile_id,
    academic_year: r.academic_year,
    term: r.term,
    year_level: r.year_level,
    group_count: r.group_count,
    type_hours: r.type_hours,
    theory_hours: r.theory_hours || (isTheoryLegacy ? (r.type_hours?.includes('15h') ? '15h' : '30h') : null),
    theory_groups,
    theory_15h_combined: r.theory_15h_combined,
    lab_hours: r.lab_hours || (isLabLegacy ? '30h' : null),
    lab_groups,
    availability: r.availability,
    availability_assignments: r.availability_assignments,
    status: r.status,
    contacted_by: r.contacted_by,
    room_number: r.room_number,
    theory_room_number: r.theory_room_number,
    lab_room_number: r.lab_room_number,
    comment: r.comment,
    class: r.Class ? {
      id: r.Class.id, name: r.Class.name, term: r.Class.term,
      year_level: r.Class.year_level, academic_year: r.Class.academic_year,
      total_class: r.Class.total_class, specialization_id: r.Class.specialization_id ?? null,
      specialization: r.Class.Specialization ? { id: r.Class.Specialization.id, name: r.Class.Specialization.name } : null,
    } : null,
    group: r.Group ? { id: r.Group.id, name: r.Group.name, num_of_student: r.Group.num_of_student } : null,
    course: r.Course ? { id: r.Course.id, code: r.Course.course_code, name: r.Course.course_name, hours: r.Course.hours, credits: r.Course.credits } : null,
    lecturer: r.LecturerProfile ? { id: r.LecturerProfile.id, name: r.LecturerProfile.full_name_english || r.LecturerProfile.full_name_khmer } : null,
  };
}

// ---------------------------------------------------------------------------
// backfillSchedules
// ---------------------------------------------------------------------------

export async function backfillSchedules({ role, department_name }) {
  const deptId = await resolveDeptId({ role, department_name });
  const rows = await CourseMapping.findAll({
    where: deptId ? { dept_id: deptId } : undefined,
    attributes: ['id', 'status', 'group_id', 'availability'],
    order: [['updated_at', 'DESC']],
  });

  const allTimeSlots = await TimeSlot.findAll();
  const cachedTimeSlotMap = new Map(allTimeSlots.map((ts) => [ts.label, ts.id]));

  let eligible = 0;
  let synced = 0;
  const failed = [];
  const CONCURRENCY_LIMIT = 5;
  let index = 0;

  const worker = async () => {
    while (true) {
      const currentIndex = index;
      if (currentIndex >= rows.length) break;
      index += 1;
      const row = rows[currentIndex];
      if (!(row.group_id && row.availability && isAcceptedStatus(row.status))) continue;
      eligible += 1;
      try {
        await syncScheduleForCourseMapping(row.id, cachedTimeSlotMap);
        synced += 1;
      } catch (e) {
        failed.push({ id: row.id, error: e?.message || 'Unknown error' });
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY_LIMIT }, worker));

  return { message: 'Backfill completed', totalMappings: rows.length, eligible, synced, failedCount: failed.length, failed };
}

// ---------------------------------------------------------------------------
// listCourseMappings
// ---------------------------------------------------------------------------

export async function listCourseMappingRecords({ role, department_name, query }) {
  const deptId = await resolveDeptId({ role, department_name });
  const {
    academic_year, status, term, year_level,
    class_id: classIdRaw, group_id: groupIdRaw, course_id: courseIdRaw,
    lecturer_profile_id: lecturerProfileIdRaw, page: rawPage, limit: rawLimit,
  } = query;

  const where = {};
  if (deptId) where.dept_id = deptId;
  if ((academic_year || '').trim()) where.academic_year = academic_year.trim();
  if ((status || '').trim()) where.status = status.trim();
  if ((term || '').trim()) where.term = term.trim();
  if ((year_level || '').trim()) where.year_level = year_level.trim();

  const parseOptionalInt = (raw) => {
    const n = parseInt(String(raw || ''), 10);
    return Number.isInteger(n) && n > 0 ? n : null;
  };
  const classId = parseOptionalInt(classIdRaw);
  const groupId = parseOptionalInt(groupIdRaw);
  const courseId = parseOptionalInt(courseIdRaw);
  const lecturerProfileId = parseOptionalInt(lecturerProfileIdRaw);
  if (classId) where.class_id = classId;
  if (groupId) where.group_id = groupId;
  if (courseId) where.course_id = courseId;
  if (lecturerProfileId) where.lecturer_profile_id = lecturerProfileId;

  const page = Math.max(parseInt(rawPage, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 10, 1), 100);
  const offset = (page - 1) * limit;

  const { rows, count } = await CourseMapping.findAndCountAll({
    where,
    include: [
      {
        model: ClassModel,
        attributes: ['id', 'name', 'term', 'year_level', 'academic_year', 'total_class', 'specialization_id'],
        include: [{ model: Specialization, attributes: ['id', 'name'], required: false }],
      },
      { model: Group, attributes: ['id', 'name', 'num_of_student', 'class_id'], required: false },
      { model: Course, attributes: ['id', 'course_code', 'course_name', 'hours', 'credits'] },
      { model: LecturerProfile, attributes: ['id', 'full_name_english', 'full_name_khmer'] },
    ],
    order: [['updated_at', 'DESC']],
    limit,
    offset,
  });

  const totalPages = Math.ceil(count / limit) || 1;
  return {
    data: rows.map(serializeMapping),
    page, limit, total: count, totalPages,
    hasMore: page < totalPages,
    note: 'Paginated: server-side pagination with page & limit (default 10) for infinite scroll',
  };
}

// ---------------------------------------------------------------------------
// listCourseMappingAcademicYears
// ---------------------------------------------------------------------------

export async function listCourseMappingAcademicYearsRecords({ role, department_name }) {
  const deptId = await resolveDeptId({ role, department_name });
  const where = { academic_year: { [Op.ne]: null }, status: 'Accepted' };
  if (deptId) where.dept_id = deptId;

  const rows = await CourseMapping.findAll({
    attributes: ['academic_year'],
    where,
    group: ['academic_year'],
    order: [['academic_year', 'DESC']],
    raw: true,
  });
  return rows.map((r) => String(r?.academic_year || '').trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// createCourseMapping
// ---------------------------------------------------------------------------

export async function createCourseMappingRecord({ body, role, department_name }) {
  const {
    class_id, group_id, group_ids, theory_group_ids, lab_group_ids,
    course_id, lecturer_profile_id, academic_year, term, year_level,
    group_count, type_hours, availability, status, contacted_by,
    room_by_group, theory_room_by_group, lab_room_by_group,
    room_number, theory_room_number, lab_room_number, comment,
    theory_hours, theory_groups, lab_hours, lab_groups, theory_15h_combined,
    availability_assignments_by_group,
  } = body;

  if (!class_id || !course_id || !academic_year || !term) {
    throw new ValidationError('class_id, course_id, academic_year, term required', {
      payload: { message: 'class_id, course_id, academic_year, term required' },
    });
  }

  const cls = await ClassModel.findByPk(class_id);
  if (!cls) throw new ValidationError('Invalid class_id', { payload: { message: 'Invalid class_id' } });

  const parsedCourseId = parseInt(course_id, 10);
  if (!Number.isInteger(parsedCourseId)) {
    throw new ValidationError('course_id must be an existing Course numeric id', {
      payload: { message: 'course_id must be an existing Course numeric id' },
    });
  }
  const course = await Course.findByPk(parsedCourseId);
  if (!course) throw new ValidationError('Invalid course_id (Course not found)', { payload: { message: 'Invalid course_id (Course not found)' } });

  const parseIdArray = (raw) =>
    Array.from(new Set((Array.isArray(raw) ? raw : []).map((x) => parseInt(String(x), 10)).filter((n) => Number.isInteger(n) && n > 0)));

  const theoryGroupIds = parseIdArray(theory_group_ids);
  const labGroupIds = parseIdArray(lab_group_ids);
  const hasTypedGroups = theoryGroupIds.length > 0 || labGroupIds.length > 0;
  const assignmentsByGroup = normalizeAssignmentsByGroup(availability_assignments_by_group);

  const groupIdsRaw = Array.isArray(group_ids)
    ? group_ids
    : group_id !== undefined && group_id !== null && String(group_id).trim() !== '' ? [group_id] : [];
  const groupIdsLegacy = Array.from(new Set(groupIdsRaw.map((x) => parseInt(String(x), 10)).filter((n) => Number.isInteger(n) && n > 0)));

  if (!hasTypedGroups && groupIdsRaw.length && !groupIdsLegacy.length) {
    throw new ValidationError('group_ids must contain valid numeric ids', { payload: { message: 'group_ids must contain valid numeric ids' } });
  }

  const unionGroupIds = hasTypedGroups ? Array.from(new Set([...theoryGroupIds, ...labGroupIds])) : groupIdsLegacy;

  let groupsById = new Map();
  if (unionGroupIds.length) {
    const groups = await Group.findAll({ where: { id: unionGroupIds, class_id }, attributes: ['id', 'class_id', 'name'] });
    if (groups.length !== unionGroupIds.length) {
      throw new ValidationError('Invalid group ids for the selected class', { payload: { message: 'Invalid group ids for the selected class' } });
    }
    groupsById = new Map(groups.map((g) => [String(g.id), g]));
  }

  let thGroupsIn = parseInt(theory_groups, 10);
  let lbGroupsIn = parseInt(lab_groups, 10);
  if (!Number.isFinite(thGroupsIn) || thGroupsIn < 0) thGroupsIn = 0;
  if (!Number.isFinite(lbGroupsIn) || lbGroupsIn < 0) lbGroupsIn = 0;
  if (hasTypedGroups) { thGroupsIn = theoryGroupIds.length; lbGroupsIn = labGroupIds.length; }

  const theorySelected = thGroupsIn > 0 || (typeof theory_hours === 'string' && theory_hours.trim());
  const labSelected = lbGroupsIn > 0 || (typeof lab_hours === 'string' && lab_hours.trim());

  if (!theorySelected && !labSelected) {
    let typeValueLegacy = String(type_hours || '').trim();
    if (/only\s*15h/i.test(typeValueLegacy)) typeValueLegacy = 'Theory (15h)';
    if (/only\s*30h/i.test(typeValueLegacy)) typeValueLegacy = 'Lab (30h)';
    if (!['Theory (15h)', 'Lab (30h)'].includes(typeValueLegacy)) {
      throw new ValidationError('Select Theory and/or Lab with group counts', { payload: { message: 'Select Theory and/or Lab with group counts' } });
    }
    const legacyGroups = Math.max(1, parseInt(group_count, 10) || 1);
    if (typeValueLegacy.includes('Theory')) { thGroupsIn = legacyGroups; } else { lbGroupsIn = legacyGroups; }
  }

  let thHoursIn = null;
  if (thGroupsIn > 0) {
    const v = String(theory_hours || '').trim().toLowerCase();
    thHoursIn = v === '30h' ? '30h' : '15h';
  }
  const lbHoursIn = lbGroupsIn > 0 ? '30h' : null;

  const contactedBySan = contacted_by ? String(contacted_by).slice(0, 255) : null;
  const roomNumberSan = room_number ? String(room_number).trim().slice(0, 50).toUpperCase() || null : null;
  const theoryRoomNumberSan = theory_room_number ? String(theory_room_number).trim().slice(0, 50).toUpperCase() || null : null;
  const labRoomNumberSan = lab_room_number ? String(lab_room_number).trim().slice(0, 50).toUpperCase() || null : null;

  const roomByGroupSan = sanitizeRoomMap(room_by_group);
  const theoryRoomByGroupSan = sanitizeRoomMap(theory_room_by_group);
  const labRoomByGroupSan = sanitizeRoomMap(lab_room_by_group);
  const commentSan = comment ? String(comment).slice(0, 1000) : null;

  const deptId = await resolveDeptId({ role, department_name });

  let legacyType = 'Theory (15h)';
  let legacyGroupCount = 1;
  if (thGroupsIn > 0 && lbGroupsIn === 0) { legacyType = 'Theory (15h)'; legacyGroupCount = thGroupsIn; }
  else if (lbGroupsIn > 0 && thGroupsIn === 0) { legacyType = 'Lab (30h)'; legacyGroupCount = lbGroupsIn; }
  else if (lbGroupsIn > 0 && thGroupsIn > 0) { legacyType = 'Theory (15h)'; legacyGroupCount = thGroupsIn; }

  const commonPayload = {
    class_id, course_id: parsedCourseId,
    lecturer_profile_id: lecturer_profile_id || null,
    academic_year, term, year_level: year_level || null,
    availability: availability || null, availability_assignments: [],
    status: status || 'Pending', contacted_by: contactedBySan,
    room_number: roomNumberSan, theory_room_number: theoryRoomNumberSan,
    lab_room_number: labRoomNumberSan, comment: commentSan, dept_id: deptId,
  };

  // Validate structured assignments if provided
  if (unionGroupIds.length && Object.keys(assignmentsByGroup || {}).length > 0) {
    const errors = [];
    const usedSlots = new Map();
    const theorySel = new Set(theoryGroupIds.map(String));
    const labSel = new Set(labGroupIds.map(String));
    const theoryMin = 1;
    const theoryMax = thHoursIn === '30h' ? 2 : 1;
    const allowTheoryOverlap = thHoursIn === '15h';

    for (const gidNum of unionGroupIds) {
      const gid = String(gidNum);
      const inTheory = hasTypedGroups ? theorySel.has(gid) : true;
      const inLab = hasTypedGroups ? labSel.has(gid) : true;
      const th = assignmentsByGroup?.[gid]?.THEORY || [];
      const lb = assignmentsByGroup?.[gid]?.LAB || [];
      const gName = groupsById.get(gid)?.name || `Group ${gid}`;

      if (inTheory && (th.length < theoryMin || th.length > theoryMax)) {
        const range = theoryMin === theoryMax ? `exactly ${theoryMin}` : `${theoryMin}–${theoryMax}`;
        errors.push(`${gName}: Theory requires ${range} session${theoryMax !== 1 ? 's' : ''}`);
      }
      if (!inTheory && th.length) errors.push(`${gName}: Theory sessions provided but group is not selected for Theory`);
      if (inLab && lb.length !== 2) errors.push(`${gName}: Lab requires exactly 2 sessions`);
      if (!inLab && lb.length) errors.push(`${gName}: Lab sessions provided but group is not selected for Lab`);

      const consume = (arr, groupType) => {
        const seenLocal = new Set();
        for (const s of arr) {
          const day = normalizeDay(s?.day);
          const session = normalizeSession(s?.session || s?.sessionId);
          if (!day || !session) { errors.push(`${gName}: invalid ${groupType} session`); continue; }
          const key = `${day}|${session}`;
          if (seenLocal.has(key)) { errors.push(`${gName}: duplicate slot ${day} ${session} in ${groupType}`); continue; }
          seenLocal.add(key);
          if (groupType === 'THEORY' && allowTheoryOverlap) {
            if (usedSlots.has(key) && usedSlots.get(key).groupType !== 'THEORY') {
              errors.push(`Slot ${day} ${session} is assigned to more than one group (Lab and Theory)`);
            } else { usedSlots.set(key, { groupType, groupName: gName }); }
          } else {
            if (usedSlots.has(key)) {
              const prev = usedSlots.get(key);
              errors.push(`Slot ${day} ${session} is assigned to multiple groups (${prev.groupType} group ${prev.groupName} and ${groupType} group ${gName})`);
            } else { usedSlots.set(key, { groupType, groupName: gName }); }
          }
        }
      };
      if (inTheory) consume(th, 'THEORY');
      if (inLab) consume(lb, 'LAB');
    }
    if (errors.length) throw new ValidationError('Validation error', { payload: { message: 'Validation error', errors } });
  }

  // No group selection: single aggregate mapping (legacy)
  if (!unionGroupIds.length) {
    const created = await CourseMapping.create({
      ...commonPayload, group_id: null, group_count: legacyGroupCount, type_hours: legacyType,
      theory_hours: thHoursIn, theory_groups: thGroupsIn, theory_15h_combined: !!theory_15h_combined,
      lab_hours: lbHoursIn, lab_groups: lbGroupsIn,
    });
    try { await syncScheduleForCourseMapping(created.id); } catch (syncErr) {
      console.warn('[createCourseMapping] auto schedule sync failed', syncErr?.message);
    }
    return { id: created.id };
  }

  // One row per group
  const theorySet = new Set(theoryGroupIds.map(String));
  const labSet = new Set(labGroupIds.map(String));
  const toAssigned = (arr) => (Array.isArray(arr) ? arr : []).map((s) => {
    const day = normalizeDay(s?.day);
    const session = normalizeSession(s?.session || s?.sessionId);
    const r = SESSION_TO_RANGE[session];
    return { day, session, startTime: r?.startTime, endTime: r?.endTime };
  });

  const createdRows = await Promise.all(
    unionGroupIds.map((gid) => {
      const key = String(gid);
      const inTheory = hasTypedGroups ? theorySet.has(key) : true;
      const inLab = hasTypedGroups ? labSet.has(key) : true;
      const thSessions = inTheory ? assignmentsByGroup?.[key]?.THEORY || [] : [];
      const lbSessions = inLab ? assignmentsByGroup?.[key]?.LAB || [] : [];
      const rowSessions = [...thSessions, ...lbSessions];
      const derivedAvailability = rowSessions.length ? buildAvailabilityStringFromSessions(rowSessions) : commonPayload.availability;
      const groupName = groupsById.get(key)?.name || '';
      const groupNumber = parseGroupNumberFromName(groupName, key);
      const rowAssignments = [];
      if (inTheory) rowAssignments.push({ groupType: 'THEORY', groupNumber, groupId: parseInt(key, 10), assignedSessions: toAssigned(thSessions) });
      if (inLab) rowAssignments.push({ groupType: 'LAB', groupNumber, groupId: parseInt(key, 10), assignedSessions: toAssigned(lbSessions) });
      const rowTheoryRoom = inTheory ? theoryRoomByGroupSan[key] || roomByGroupSan[key] || commonPayload.theory_room_number || commonPayload.room_number : null;
      const rowLabRoom = inLab ? labRoomByGroupSan[key] || roomByGroupSan[key] || commonPayload.lab_room_number || commonPayload.room_number : null;
      return CourseMapping.create({
        ...commonPayload,
        availability: derivedAvailability, availability_assignments: rowAssignments,
        room_number: rowTheoryRoom || rowLabRoom || commonPayload.room_number,
        theory_room_number: rowTheoryRoom, lab_room_number: rowLabRoom,
        group_id: gid, group_count: 1,
        type_hours: inTheory ? 'Theory (15h)' : 'Lab (30h)',
        theory_hours: inTheory ? thHoursIn || '15h' : null, theory_groups: inTheory ? 1 : 0,
        theory_15h_combined: false,
        lab_hours: inLab ? '30h' : null, lab_groups: inLab ? 1 : 0,
      });
    })
  );

  try { await Promise.all(createdRows.map((row) => syncScheduleForCourseMapping(row.id))); }
  catch (syncErr) { console.warn('[createCourseMapping] auto schedule sync failed', syncErr?.message); }

  return { created: createdRows.length, ids: createdRows.map((r) => r.id) };
}

// ---------------------------------------------------------------------------
// updateCourseMapping
// ---------------------------------------------------------------------------

export async function updateCourseMappingRecord({ id, body, role, department_name }) {
  const deptId = await resolveDeptId({ role, department_name });
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(body || {}, key);
  const parseIdArray = (raw) =>
    Array.from(new Set((Array.isArray(raw) ? raw : []).map((x) => parseInt(String(x), 10)).filter((n) => Number.isInteger(n) && n > 0)));

  const rawIds = Array.isArray(body?.ids) ? body.ids : null;
  const ids = rawIds
    ? Array.from(new Set(rawIds.map((x) => parseInt(String(x), 10)).filter((n) => Number.isInteger(n) && n > 0)))
    : null;
  const targetIds = ids && ids.length ? ids : [id];

  const mappings = await CourseMapping.findAll({ where: { id: targetIds } });
  if (!mappings.length) throw new NotFoundError('Mapping not found', { payload: { message: 'Mapping not found' } });
  if (mappings.length !== targetIds.length) throw new NotFoundError('Some mappings not found', { payload: { message: 'Some mappings not found' } });
  if (deptId && mappings.some((m) => m.dept_id !== deptId)) {
    throw new ForbiddenError('Access denied', { payload: { message: 'Access denied' } });
  }

  const mapping = mappings[0];
  const explicitTheoryGroupIds = hasOwn('theory_group_ids') ? parseIdArray(body.theory_group_ids) : null;
  const explicitLabGroupIds = hasOwn('lab_group_ids') ? parseIdArray(body.lab_group_ids) : null;
  const explicitGroupSelectionRequested = explicitTheoryGroupIds !== null || explicitLabGroupIds !== null;
  const explicitTheoryGroupSet = new Set((explicitTheoryGroupIds || []).map(String));
  const explicitLabGroupSet = new Set((explicitLabGroupIds || []).map(String));
  const existingGroupedMappings = mappings.filter((m) => m?.group_id);
  const existingGroupIdSet = new Set(existingGroupedMappings.map((m) => String(m.group_id)));

  if (explicitGroupSelectionRequested) {
    const unknownGroupIds = [...new Set([...explicitTheoryGroupSet, ...explicitLabGroupSet])].filter((gid) => !existingGroupIdSet.has(gid));
    if (unknownGroupIds.length) {
      throw new ValidationError('Some selected groups do not belong to this mapping batch', {
        payload: { message: 'Some selected groups do not belong to this mapping batch', errors: unknownGroupIds.map((gid) => `Group ${gid} is not part of the edited mapping set`) },
      });
    }
  }

  const allowed = [
    'lecturer_profile_id', 'group_count', 'type_hours', 'availability',
    'availability_assignments', 'availability_assignments_by_group', 'status',
    'contacted_by', 'room_number', 'theory_room_number', 'lab_room_number',
    'theory_room_by_group', 'lab_room_by_group', 'comment', 'theory_hours',
    'theory_groups', 'lab_hours', 'lab_groups', 'theory_15h_combined',
  ];
  const patch = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];

  const structuredModeRequested = Object.prototype.hasOwnProperty.call(body, 'availability_assignments_by_group');
  const assignmentsByGroupPatch = structuredModeRequested ? normalizeAssignmentsByGroup(body.availability_assignments_by_group) : {};
  const structuredClearAll = structuredModeRequested && Object.keys(assignmentsByGroupPatch || {}).length === 0;
  delete patch.availability_assignments_by_group;

  const structuredPerGroupId = new Map();
  if (structuredModeRequested && !structuredClearAll) {
    const errors = [];
    const usedSlots = new Map();

    const getRequestedModes = (row) => {
      const gid = row?.group_id ? String(row.group_id) : null;
      if (explicitGroupSelectionRequested && gid) {
        return { inTheory: explicitTheoryGroupSet.has(gid), inLab: explicitLabGroupSet.has(gid) };
      }
      return {
        inTheory: (parseInt(String(row?.theory_groups ?? 0), 10) || 0) > 0,
        inLab: (parseInt(String(row?.lab_groups ?? 0), 10) || 0) > 0,
      };
    };

    const toAssigned = (arr) => (Array.isArray(arr) ? arr : []).map((s) => {
      const day = normalizeDay(s?.day);
      const session = normalizeSession(s?.session || s?.sessionId);
      const r = SESSION_TO_RANGE[session];
      return { day, session, startTime: r?.startTime, endTime: r?.endTime };
    });

    for (const m of mappings) {
      const gid = m?.group_id ? String(m.group_id) : null;
      if (!gid) { errors.push('Structured availability requires group-specific mappings (group_id is missing).'); continue; }
      const { inTheory, inLab } = getRequestedModes(m);
      if (!inTheory && !inLab) { structuredPerGroupId.set(gid, { availability: null, availability_assignments: [] }); continue; }

      const rowTheoryHours = String(m?.theory_hours || '').trim().toLowerCase() === '30h' ? '30h' : '15h';
      const rowTheoryMin = inTheory ? 1 : 0;
      const rowTheoryMax = inTheory ? (rowTheoryHours === '30h' ? 2 : 1) : 0;
      const th = assignmentsByGroupPatch?.[gid]?.THEORY || [];
      const lb = assignmentsByGroupPatch?.[gid]?.LAB || [];

      if (inTheory && (th.length < rowTheoryMin || th.length > rowTheoryMax)) {
        const range = rowTheoryMin === rowTheoryMax ? `exactly ${rowTheoryMin}` : `${rowTheoryMin}–${rowTheoryMax}`;
        errors.push(`Group ${gid}: Theory requires ${range} session${rowTheoryMax !== 1 ? 's' : ''}`);
      }
      if (!inTheory && th.length) errors.push(`Group ${gid}: Theory sessions provided but mapping has no Theory`);
      if (inLab && lb.length !== 2) errors.push(`Group ${gid}: Lab requires exactly 2 sessions`);
      if (!inLab && lb.length) errors.push(`Group ${gid}: Lab sessions provided but mapping has no Lab`);

      const consume = (arr, groupType) => {
        const seenLocal = new Set();
        for (const s of arr) {
          const day = normalizeDay(s?.day);
          const session = normalizeSession(s?.session || s?.sessionId);
          if (!day || !session) { errors.push(`Group ${gid}: invalid ${groupType} session`); continue; }
          const key = `${day}|${session}`;
          if (seenLocal.has(key)) { errors.push(`Group ${gid}: duplicate slot ${day} ${session} in ${groupType}`); continue; }
          seenLocal.add(key);
          const prev = usedSlots.get(key);
          if (!prev) { usedSlots.set(key, { groupType, groupId: gid, theoryHours: groupType === 'THEORY' ? rowTheoryHours : null }); continue; }
          if (groupType === 'LAB' || prev.groupType === 'LAB') {
            errors.push(`Slot ${day} ${session} is assigned to multiple groups (${prev.groupType} group ${prev.groupId} and ${groupType} group ${gid})`); continue;
          }
          const prevHours = String(prev.theoryHours || '').toLowerCase() === '30h' ? '30h' : '15h';
          if (!(prevHours === '15h' && rowTheoryHours === '15h')) {
            errors.push(`Slot ${day} ${session} is assigned to multiple groups (${prev.groupType} group ${prev.groupId} and ${groupType} group ${gid})`);
          }
        }
      };
      if (inTheory) consume(th, 'THEORY');
      if (inLab) consume(lb, 'LAB');

      const groupNumber = parseGroupNumberFromName(null, gid);
      const rowAssignments = [];
      if (inTheory) rowAssignments.push({ groupType: 'THEORY', groupNumber, groupId: parseInt(gid, 10), assignedSessions: toAssigned(th) });
      if (inLab) rowAssignments.push({ groupType: 'LAB', groupNumber, groupId: parseInt(gid, 10), assignedSessions: toAssigned(lb) });
      structuredPerGroupId.set(gid, {
        availability: buildAvailabilityStringFromSessions([...(inTheory ? th : []), ...(inLab ? lb : [])]),
        availability_assignments: rowAssignments,
      });
    }
    if (errors.length) throw new ValidationError('Validation error', { payload: { message: 'Validation error', errors } });
  }

  if (structuredModeRequested) {
    delete patch.availability_assignments;
    delete patch.availability;
  }

  if ('group_count' in patch) {
    let groups = parseInt(patch.group_count, 10);
    if (!Number.isFinite(groups) || groups < 1) groups = 1;
    patch.group_count = groups;
  }
  if ('type_hours' in patch) {
    let typeValue = String(patch.type_hours || '').trim();
    if (/only\s*15h/i.test(typeValue)) typeValue = 'Theory (15h)';
    if (/only\s*30h/i.test(typeValue)) typeValue = 'Lab (30h)';
    if (!['Theory (15h)', 'Lab (30h)'].includes(typeValue)) typeValue = 'Theory (15h)';
    patch.type_hours = typeValue;
  }
  if ('theory_groups' in patch) {
    let g = parseInt(patch.theory_groups, 10);
    if (!Number.isFinite(g) || g < 0) g = 0;
    patch.theory_groups = g;
    if (g === 0) { patch.theory_hours = null; }
    else if (!('theory_hours' in patch)) { patch.theory_hours = mapping.theory_hours || '15h'; }
    if (patch.theory_hours && !['15h', '30h'].includes(String(patch.theory_hours).toLowerCase())) patch.theory_hours = '15h';
  }
  if ('lab_groups' in patch) {
    let g = parseInt(patch.lab_groups, 10);
    if (!Number.isFinite(g) || g < 0) g = 0;
    patch.lab_groups = g;
    patch.lab_hours = g === 0 ? null : '30h';
  }
  if ('contacted_by' in patch && patch.contacted_by !== null && patch.contacted_by !== undefined) patch.contacted_by = String(patch.contacted_by).slice(0, 255);
  if ('room_number' in patch) patch.room_number = patch.room_number ? String(patch.room_number).trim().slice(0, 50).toUpperCase() || null : null;
  if ('theory_room_number' in patch) patch.theory_room_number = patch.theory_room_number ? String(patch.theory_room_number).trim().slice(0, 50).toUpperCase() || null : null;
  if ('lab_room_number' in patch) patch.lab_room_number = patch.lab_room_number ? String(patch.lab_room_number).trim().slice(0, 50).toUpperCase() || null : null;

  const theoryRoomByGroupPatch = 'theory_room_by_group' in patch ? sanitizeRoomMap(patch.theory_room_by_group, true) : null;
  const labRoomByGroupPatch = 'lab_room_by_group' in patch ? sanitizeRoomMap(patch.lab_room_by_group, true) : null;
  delete patch.theory_room_by_group;
  delete patch.lab_room_by_group;

  if (!('room_number' in patch) && ('theory_room_number' in patch || 'lab_room_number' in patch)) {
    const finalTheory = 'theory_room_number' in patch ? patch.theory_room_number : mapping.theory_room_number;
    const finalLab = 'lab_room_number' in patch ? patch.lab_room_number : mapping.lab_room_number;
    patch.room_number = finalTheory || finalLab || null;
  }
  if ('comment' in patch && patch.comment !== null && patch.comment !== undefined) patch.comment = String(patch.comment).slice(0, 1000);

  if ('theory_groups' in patch || 'lab_groups' in patch || 'theory_hours' in patch || 'lab_hours' in patch) {
    const tGroups = 'theory_groups' in patch ? patch.theory_groups : mapping.theory_groups || 0;
    const lGroups = 'lab_groups' in patch ? patch.lab_groups : mapping.lab_groups || 0;
    const tHours = 'theory_hours' in patch ? patch.theory_hours : mapping.theory_hours;
    if (tGroups > 0 && lGroups === 0) { patch.type_hours = tHours === '30h' ? 'Lab (30h)' : 'Theory (15h)'; patch.group_count = tGroups; }
    else if (lGroups > 0 && tGroups === 0) { patch.type_hours = 'Lab (30h)'; patch.group_count = lGroups; }
    else if (lGroups > 0 && tGroups > 0) { patch.type_hours = tHours === '30h' ? 'Lab (30h)' : 'Theory (15h)'; patch.group_count = Math.max(tGroups, lGroups); }
  }

  const groupedBatchEdit = explicitGroupSelectionRequested && existingGroupedMappings.length === mappings.length;
  const buildPerMappingPatch = (m) => {
    const perPatch = { ...patch };
    const gid = m.group_id ? String(m.group_id) : null;

    if (groupedBatchEdit && gid) {
      const wantsTheory = explicitTheoryGroupSet.has(gid);
      const wantsLab = explicitLabGroupSet.has(gid);
      if (!wantsTheory && !wantsLab) {
        return { ...perPatch, lecturer_profile_id: null, status: 'Pending', contacted_by: null, comment: null, availability: null, availability_assignments: [], room_number: null, theory_room_number: null, lab_room_number: null };
      }
      const tHr = String('theory_hours' in patch ? patch.theory_hours : m.theory_hours || '15h').toLowerCase() === '30h' ? '30h' : '15h';
      perPatch.theory_groups = wantsTheory ? 1 : 0;
      perPatch.theory_hours = wantsTheory ? tHr : null;
      perPatch.lab_groups = wantsLab ? 1 : 0;
      perPatch.lab_hours = wantsLab ? '30h' : null;
      perPatch.group_count = 1;
      perPatch.type_hours = wantsTheory ? 'Theory (15h)' : 'Lab (30h)';
      perPatch.theory_15h_combined = false;
    }

    if (structuredModeRequested) {
      if (structuredClearAll) { perPatch.availability = null; perPatch.availability_assignments = []; }
      else if (gid && structuredPerGroupId.has(gid)) {
        const st = structuredPerGroupId.get(gid);
        perPatch.availability = st.availability;
        perPatch.availability_assignments = st.availability_assignments;
      }
    }

    if (gid && theoryRoomByGroupPatch && gid in theoryRoomByGroupPatch) perPatch.theory_room_number = theoryRoomByGroupPatch[gid];
    if (gid && labRoomByGroupPatch && gid in labRoomByGroupPatch) perPatch.lab_room_number = labRoomByGroupPatch[gid];
    if (groupedBatchEdit && gid) {
      if (!explicitTheoryGroupSet.has(gid)) perPatch.theory_room_number = null;
      if (!explicitLabGroupSet.has(gid)) perPatch.lab_room_number = null;
    }
    if (!('room_number' in perPatch) && ('theory_room_number' in perPatch || 'lab_room_number' in perPatch)) {
      const finalTheory = 'theory_room_number' in perPatch ? perPatch.theory_room_number : m.theory_room_number;
      const finalLab = 'lab_room_number' in perPatch ? perPatch.lab_room_number : m.lab_room_number;
      perPatch.room_number = finalTheory || finalLab || null;
    }
    return perPatch;
  };

  await Promise.all(mappings.map((m) => m.update(buildPerMappingPatch(m))));
  try { await Promise.all(mappings.map((m) => syncScheduleForCourseMapping(m.id))); }
  catch (syncErr) { console.warn('[updateCourseMapping] auto schedule sync failed', syncErr?.message); }

  return { message: 'Updated', updated: mappings.length };
}

// ---------------------------------------------------------------------------
// deleteCourseMapping
// ---------------------------------------------------------------------------

export async function deleteCourseMappingRecord({ id, idsParam, role, department_name }) {
  const deptId = await resolveDeptId({ role, department_name });
  const parsedIdsParam = String(idsParam || '').trim();
  const ids = parsedIdsParam
    ? Array.from(new Set(parsedIdsParam.split(',').map((x) => parseInt(String(x).trim(), 10)).filter((n) => Number.isInteger(n) && n > 0)))
    : null;
  const targetIds = ids && ids.length ? ids : [parseInt(id, 10)];

  const mappings = await CourseMapping.findAll({ where: { id: targetIds } });
  if (!mappings.length) throw new NotFoundError('Mapping not found', { payload: { message: 'Mapping not found' } });
  if (deptId && mappings.some((m) => m.dept_id !== deptId)) {
    throw new ForbiddenError('Access denied', { payload: { message: 'Access denied' } });
  }
  await Promise.all(mappings.map((m) => m.destroy()));
  return { message: 'Deleted', deleted: mappings.length };
}

// ---------------------------------------------------------------------------
// generateCourseMappingExcel
// ---------------------------------------------------------------------------

export async function generateCourseMappingExcel({ academicYear, termStart, termEnd, role, department_name }) {
  const deptId = await resolveDeptId({ role, department_name });
  const where = {};
  if (deptId) where.dept_id = deptId;
  if (academicYear) where.academic_year = academicYear;

  const rows = await CourseMapping.findAll({
    where,
    include: [
      { model: ClassModel, attributes: ['id', 'name', 'term', 'year_level', 'academic_year', 'total_class'] },
      { model: Course, attributes: ['id', 'course_code', 'course_name', 'hours', 'credits'] },
      { model: LecturerProfile, attributes: ['id', 'full_name_english', 'full_name_khmer'] },
    ],
    order: [[ClassModel, 'name', 'ASC'], ['term', 'ASC'], ['id', 'ASC']],
  });

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Course Mapping');

  ws.mergeCells('A1:P1');
  const topHeader = `${academicYear || 'Academic Year'} | CADT | IDT | CS Department | Terms Operate`;
  ws.getCell('A1').value = topHeader;
  ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('A1').font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F3251' } };
  ws.getRow(1).height = 24;

  ws.mergeCells('A2:P2');
  const termLine = termStart && termEnd ? `► Term Start : ${termStart} - ${termEnd}` : '► Term Start : [start - end]';
  ws.getCell('A2').value = termLine;
  ws.getCell('A2').alignment = { horizontal: 'center' };
  ws.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFED7D31' } };
  ws.getCell('A2').font = { bold: true, color: { argb: 'FFFFFFFF' } };

  const headers = ['No', 'Subject', 'Hour', 'Credit', 'Total class', 'Lecturers and TAs', 'Group', 'Theory', 'Lab', 'Only15h', 'Only30h', 'Status', 'Availability', 'Survey Form', 'Contacted By', 'Comments'];
  const headerRow = ws.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9D9D9' } };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  ws.getRow(3).height = 18;

  let no = 1;
  for (const r of rows) {
    const crs = r.Course;
    const lect = r.LecturerProfile;
    const type = (r.type_hours || '').toLowerCase();
    const theory = type.includes('theory') || type.includes('15h') ? 1 : '';
    const lab = type.includes('lab') || type.includes('30h') ? 1 : '';
    const only15h = /only\s*15h/i.test(r.type_hours || '') ? 1 : '';
    const only30h = /only\s*30h/i.test(r.type_hours || '') ? 1 : '';
    const row = ws.addRow([
      no++,
      crs ? crs.course_name : `Course #${r.course_id}`,
      crs?.hours ?? '',
      crs?.credits ?? '',
      r.Class?.total_class ?? '',
      lect ? lect.full_name_english || lect.full_name_khmer : '',
      r.group_count ?? '',
      theory, lab, only15h, only30h,
      r.status || '', r.availability || '', '',
      r.contacted_by || '', r.comment || '',
    ]);

    const statusCell = row.getCell(12);
    const st = String(r.status || '').toLowerCase();
    if (st === 'pending') statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
    if (st === 'rejected') statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
    if (st === 'accepted') statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };

    row.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  }

  ws.columns = headers.map((h, i) => ({ header: h, key: `c${i}`, width: Math.max(12, String(h).length + 2) }));

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer: Buffer.from(buffer), fileName: `CourseMapping_${academicYear || 'All'}.xlsx` };
}
