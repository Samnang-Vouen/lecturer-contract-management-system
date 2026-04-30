import Schedule from '../model/schedule.model.js';
import ScheduleEntry from '../model/scheduleEntry.model.js';
import Group from '../model/group.model.js';
import CourseMapping from '../model/courseMapping.model.js';
import Course from '../model/course.model.js';
import LecturerProfile from '../model/lecturerProfile.model.js';
import ClassModel from '../model/class.model.js';
import Specialization from '../model/specialization.model.js';
import Department from '../model/department.model.js';
import Major from '../model/major.model.js';
import { TimeSlot } from '../model/timeSlot.model.js';
import { Op } from 'sequelize';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { normalizeDay, normalizeSession, parseAvailability, SESSION_TO_RANGE } from '../utils/availabilityParser.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function embedIdtLogo(html) {
  const logoPath = path.join(process.cwd(), 'src', 'utils', 'idt-logo-blue.png');
  let base64 = '';
  try { base64 = fs.readFileSync(logoPath, 'base64'); } catch {}
  return html.replace('src="idt-logo-blue.png"', `src="data:image/png;base64,${base64}"`);
}

function safeInt(value) {
  const n = parseInt(String(value ?? ''), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function isAdminRole(userRole) {
  return String(userRole || '').toLowerCase() === 'admin';
}

async function resolveAdminDepartment({ userRole, departmentName }) {
  if (!isAdminRole(userRole)) return null;
  const deptName = String(departmentName || '').trim();
  if (!deptName) return { id: null, dept_name: '' };
  const dept = await Department.findOne({ where: { dept_name: deptName }, attributes: ['id', 'dept_name'] });
  return dept ? dept.get({ plain: true }) : { id: null, dept_name: deptName };
}

async function listAuthorizedGroupIdsForDepartment(deptName, groupIds) {
  const normalizedIds = Array.from(new Set((Array.isArray(groupIds) ? groupIds : []).map(safeInt).filter(Boolean)));
  if (!deptName || !normalizedIds.length) return [];
  const rows = await Group.findAll({
    where: { id: { [Op.in]: normalizedIds } },
    attributes: ['id'],
    include: [{ model: ClassModel, attributes: [], required: true, include: [{ model: Specialization, attributes: [], required: true, include: [{ model: Department, attributes: [], required: true, where: { dept_name: deptName } }] }] }],
  });
  return rows.map((row) => row.id);
}

function parseCustomCells(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}

function stringifyCustomCells(value) {
  try { return JSON.stringify(value && typeof value === 'object' ? value : {}); } catch { return '{}'; }
}

async function saveCustomCellsByGroup(customCellsByGroup) {
  const entries = Object.entries(customCellsByGroup || {});
  if (!entries.length) return;
  for (const [groupIdKey, cellMap] of entries) {
    const groupId = safeInt(groupIdKey);
    if (!groupId) continue;
    const serialized = stringifyCustomCells(cellMap);
    const existing = await Schedule.findOne({ where: { group_id: groupId }, order: [['created_at', 'DESC']] });
    if (existing) { await existing.update({ custom_cells: serialized }); continue; }
    await Schedule.create({ group_id: groupId, name: `Auto Schedule Group ${groupId}`, notes: null, custom_cells: serialized, start_date: null });
  }
}

async function loadCustomCellsByGroup(groupIds) {
  if (!Array.isArray(groupIds) || !groupIds.length) return {};
  const rows = await Schedule.findAll({
    where: { group_id: { [Op.in]: groupIds } },
    attributes: ['group_id', 'custom_cells', 'created_at'],
    order: [['group_id', 'ASC'], ['created_at', 'DESC']],
  });
  return rows.reduce((acc, row) => {
    const gid = row?.group_id;
    if (!gid) return acc;
    const key = String(gid);
    if (!(key in acc)) acc[key] = parseCustomCells(row?.custom_cells);
    return acc;
  }, {});
}

function startDateFromAcademicYear(academicYear) {
  const m = String(academicYear || '').match(/(\d{4})\s*-\s*(\d{4})/);
  if (!m) return null;
  return `${m[1]}-10-01`;
}

function majorAbbreviation(majorName) {
  const name = String(majorName || '').trim();
  if (!name) return '';
  const canonical = name.toLowerCase();
  const map = { 'software engineering': 'SE', 'data science': 'DS', 'digital business': 'DB', 'telecom and networking engineering': 'TNE', 'cyber security': 'CS', cybersecurity: 'CS' };
  if (map[canonical]) return map[canonical];
  return name.replace(/\([^)]*\)/g, '').trim().split(/\s+/).map((w) => w.replace(/[^a-zA-Z0-9]/g, '')).filter(Boolean).map((w) => w[0]).join('').toUpperCase();
}

async function loadScheduleTemplateHTML() {
  const htmlPath = path.join(process.cwd(), 'src', 'utils', 'schedule.html');
  const scheduleHTML = fs.readFileSync(htmlPath, 'utf8');
  return embedIdtLogo(scheduleHTML);
}

function ensureUploadsScheduleDir() {
  const dirPath = path.join(process.cwd(), 'uploads', 'schedules');
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function resolveGeneratedScheduleHtmlPath(requestedFile) {
  const dirPath = ensureUploadsScheduleDir();
  if (requestedFile) {
    const safeFilename = path.basename(String(requestedFile).trim());
    if (!safeFilename.toLowerCase().endsWith('.html')) return { error: 'Invalid file parameter. Expected an .html file.' };
    const filePath = path.join(dirPath, safeFilename);
    if (!fs.existsSync(filePath)) return { error: 'Specified schedule HTML file not found. Generate HTML first.', status: 404 };
    return { filePath };
  }
  const htmlFiles = fs.readdirSync(dirPath).filter((name) => name.toLowerCase().endsWith('.html')).map((name) => { const filePath = path.join(dirPath, name); return { filePath, mtimeMs: fs.statSync(filePath).mtimeMs }; }).sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (!htmlFiles.length) return { error: 'No generated schedule HTML file found. Generate HTML first.', status: 404 };
  return { filePath: htmlFiles[0].filePath };
}

function formatDate(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  const getOrdinal = (n) => { const s = ['th', 'st', 'nd', 'rd']; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  return `${getOrdinal(day)} ${month}, ${year}`;
}

function resolveScheduleStartDate({ classStartTerm, scheduleStartDate, academicYear }) {
  if (classStartTerm) return formatDate(classStartTerm);
  if (scheduleStartDate) return formatDate(scheduleStartDate);
  return formatDate(startDateFromAcademicYear(academicYear) || new Date());
}

function compactGroupLabel(groupName) {
  const raw = String(groupName || '').trim();
  if (!raw) return '';
  const match = raw.match(/(^|[-\s])(G\d+)$/i);
  if (match?.[2]) return match[2].toUpperCase();
  return raw;
}

function formatGroupLabel(groupName, groupNumber) {
  const raw = String(groupName || '').trim();
  if (raw && /(^|[-\s])G\d+$/i.test(raw)) return compactGroupLabel(raw);
  const n = parseInt(String(groupNumber || ''), 10);
  if (!Number.isInteger(n) || n <= 0) return compactGroupLabel(raw);
  if (new RegExp(`(^|[-\\s])G${n}$`, 'i').test(raw)) return `G${n}`;
  return `G${n}`;
}

function compareGroupLabels(left, right) {
  const leftValue = String(left || '').trim();
  const rightValue = String(right || '').trim();
  const leftNumber = parseInt(leftValue.match(/G(\d+)$/i)?.[1] || '', 10);
  const rightNumber = parseInt(rightValue.match(/G(\d+)$/i)?.[1] || '', 10);
  if (Number.isInteger(leftNumber) && Number.isInteger(rightNumber) && leftNumber !== rightNumber) return leftNumber - rightNumber;
  return leftValue.localeCompare(rightValue);
}

function roomForSessionType(mapping, sessionType, fallbackRoom) {
  if (sessionType === 'Theory') return mapping?.theory_room_number || mapping?.room_number || fallbackRoom || 'TBA';
  if (sessionType === 'Lab') return mapping?.lab_room_number || mapping?.room_number || fallbackRoom || 'TBA';
  if (sessionType === 'Theory + Lab') return mapping?.theory_room_number || mapping?.lab_room_number || mapping?.room_number || fallbackRoom || 'TBA';
  return mapping?.room_number || mapping?.theory_room_number || mapping?.lab_room_number || fallbackRoom || 'TBA';
}

function sessionLabelForDisplay(sessionType) {
  if (sessionType === 'Theory + Lab') return 'Theory + Lab Class';
  if (sessionType === 'Theory') return 'Theory Class';
  if (sessionType === 'Lab') return 'Lab Class';
  return sessionType || 'Class';
}

function normalizeHoursLabel(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

function isTheoryThirtyHours(mapping) {
  return normalizeHoursLabel(mapping?.theory_hours) === '30h';
}

function displaySessionTypeForMapping(mapping, sessionType) {
  if (sessionType === 'Theory' && isTheoryThirtyHours(mapping)) return 'Theory + Lab';
  return sessionType;
}

function formatLecturerDisplayName(title, fullName) {
  const normalizedTitle = String(title || '').trim();
  const normalizedName = String(fullName || '').trim();
  if (!normalizedTitle) return normalizedName;
  if (!normalizedName) return normalizedTitle;
  const titleToken = normalizedTitle.replace(/\./g, '').toLowerCase();
  const namePrefix = normalizedName.split(/\s+/)[0]?.replace(/\./g, '').toLowerCase() || '';
  if (titleToken && namePrefix === titleToken) return normalizedName;
  return `${normalizedTitle}. ${normalizedName}`;
}

function fallbackGroupLabels(mapping, sessionType, groupName) {
  const count = sessionType === 'Lab' ? Number(mapping?.lab_groups || 0) : sessionType === 'Theory' || sessionType === 'Theory + Lab' ? Number(mapping?.theory_groups || 0) : 0;
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, index) => formatGroupLabel(groupName, index + 1)).filter(Boolean);
}

function collectCourseMappingScheduleItems({ mapping, groupId, groupName, day, timeLabel, fallbackRoom, fallbackSessionType }) {
  const lecturerTitle = mapping?.LecturerProfile?.title || '';
  const lecturerName = mapping?.LecturerProfile?.full_name_english || '';
  const courseName = mapping?.Course?.course_name || 'Unknown Course';
  const items = [];
  const assignments = Array.isArray(mapping?.availability_assignments) ? mapping.availability_assignments : [];

  for (const assignment of assignments) {
    const sessionType = String(assignment?.groupType || '').toUpperCase() === 'LAB' ? 'Lab' : 'Theory';
    const groupLabel = formatGroupLabel(groupName, assignment?.groupNumber);
    const room = roomForSessionType(mapping, sessionType, fallbackRoom);
    for (const assignedSession of Array.isArray(assignment?.assignedSessions) ? assignment.assignedSessions : []) {
      const assignedDay = normalizeDay(assignedSession?.day);
      const sessionCode = normalizeSession(assignedSession?.session);
      const assignedTimeLabel = SESSION_TO_RANGE[sessionCode]?.timeSlot;
      if (!assignedDay || !assignedTimeLabel) continue;
      if (day && assignedDay !== day) continue;
      if (timeLabel && assignedTimeLabel !== timeLabel) continue;
      items.push({ groupId, classId: mapping?.class_id || mapping?.Class?.id || null, courseId: mapping?.course_id || mapping?.Course?.id || null, lecturerProfileId: mapping?.lecturer_profile_id || mapping?.LecturerProfile?.id || null, day: assignedDay, timeLabel: assignedTimeLabel, courseName, lecturerTitle, lecturerName, room, sessionType: displaySessionTypeForMapping(mapping, sessionType), groupLabels: groupLabel ? [groupLabel] : [] });
    }
  }

  if (items.length) return items;

  const sessionType = fallbackSessionType || computeSessionType(mapping);
  const groupLabels = fallbackGroupLabels(mapping, sessionType, groupName);
  const room = roomForSessionType(mapping, sessionType, fallbackRoom);
  const parsedSessions = parseAvailability(mapping?.availability).filter((session) => (!day || session?.day === day) && (!timeLabel || session?.timeSlot === timeLabel));

  if (parsedSessions.length) {
    return parsedSessions.map((session) => ({ groupId, classId: mapping?.class_id || mapping?.Class?.id || null, courseId: mapping?.course_id || mapping?.Course?.id || null, lecturerProfileId: mapping?.lecturer_profile_id || mapping?.LecturerProfile?.id || null, day: session.day, timeLabel: session.timeSlot, courseName, lecturerTitle, lecturerName, room, sessionType: displaySessionTypeForMapping(mapping, sessionType), groupLabels }));
  }

  if (day && timeLabel) {
    return [{ groupId, classId: mapping?.class_id || mapping?.Class?.id || null, courseId: mapping?.course_id || mapping?.Course?.id || null, lecturerProfileId: mapping?.lecturer_profile_id || mapping?.LecturerProfile?.id || null, day, timeLabel, courseName, lecturerTitle, lecturerName, room, sessionType: displaySessionTypeForMapping(mapping, sessionType), groupLabels }];
  }

  return [];
}

function mergeSessionTypes(sessionTypes) {
  const types = Array.from(sessionTypes || []).filter(Boolean);
  if (types.includes('Theory + Lab')) return 'Theory + Lab';
  if (types.includes('Theory') && types.includes('Lab')) return 'Theory + Lab';
  return types[0] || 'Class';
}

function buildEntriesByTimeAndDayForGroup({ allItems, pageGroupId }) {
  const mergedItems = new Map();
  for (const item of Array.isArray(allItems) ? allItems : []) {
    const mergeKey = [item?.day || '', item?.timeLabel || '', item?.classId || '', item?.courseId || '', item?.lecturerProfileId || '', item?.room || ''].join('||');
    if (!mergedItems.has(mergeKey)) mergedItems.set(mergeKey, { ...item, groupIds: new Set(), groupLabels: new Set(), sessionTypes: new Set() });
    const current = mergedItems.get(mergeKey);
    if (item?.groupId !== null && item?.groupId !== undefined) current.groupIds.add(item.groupId);
    if (item?.sessionType) current.sessionTypes.add(item.sessionType);
    for (const groupLabel of Array.isArray(item?.groupLabels) ? item.groupLabels : []) { if (groupLabel) current.groupLabels.add(groupLabel); }
  }
  const entriesByTimeAndDay = {};
  for (const current of mergedItems.values()) {
    if (!current.groupIds.has(pageGroupId)) continue;
    if (!entriesByTimeAndDay[current.timeLabel]) entriesByTimeAndDay[current.timeLabel] = {};
    if (!entriesByTimeAndDay[current.timeLabel][current.day]) entriesByTimeAndDay[current.timeLabel][current.day] = [];
    entriesByTimeAndDay[current.timeLabel][current.day].push({ ...current, sessionType: mergeSessionTypes(current.sessionTypes), groupLabels: Array.from(current.groupLabels).sort(compareGroupLabels) });
  }
  return entriesByTimeAndDay;
}

function computeSessionType(mapping) {
  const theoryGroups = Number(mapping?.theory_groups || 0);
  const labGroups = Number(mapping?.lab_groups || 0);
  if (theoryGroups > 0 && (labGroups > 0 || isTheoryThirtyHours(mapping))) return 'Theory + Lab';
  return labGroups > 0 ? 'Lab' : 'Theory';
}

function buildTimetableRowsHTML({ allTimeSlots, entriesByTimeAndDay, customCells, defaultEmptyCellText }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const specialSlots = { '07h:45-08h:00': 'national-anthem', '09h:30-09h:50': 'break-split', '11h:30-12h:10': 'break', '13h:40-13h:50': 'break', '15h:20-15h:30': 'break' };
  let wednesdaySeminarRendered = false;

  const renderCellItems = (items) => {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return '';
    const mergedItems = Array.from(list.reduce((acc, item) => {
      const key = [item?.courseName || '', item?.lecturerTitle || '', item?.lecturerName || '', item?.room || '', item?.sessionType || ''].join('||');
      if (!acc.has(key)) acc.set(key, { ...item, groupLabels: [] });
      const current = acc.get(key);
      for (const groupLabel of Array.isArray(item?.groupLabels) ? item.groupLabels : []) { if (groupLabel && !current.groupLabels.includes(groupLabel)) current.groupLabels.push(groupLabel); }
      return acc;
    }, new Map()).values());

    return mergedItems.map((it) => {
      const lecturer = formatLecturerDisplayName(it?.lecturerTitle, it?.lecturerName);
      const sessionLabel = sessionLabelForDisplay(it?.sessionType);
      const groupText = Array.isArray(it?.groupLabels) && it.groupLabels.length > 1 ? it.groupLabels.join('+') : '';
      return `<div style="margin: 6px 0;"><p class="class">(${sessionLabel})${groupText ? ` (${groupText})` : ''}</p><p><strong>${it?.courseName || ''}</strong></p><p>${lecturer || ''}</p><p class="class">Room: ${it?.room || 'TBA'}</p></div>`;
    }).join('');
  };

  return allTimeSlots.map((timeSlot) => {
    const time = timeSlot.label;
    const dayMap = entriesByTimeAndDay[time] || {};

    if (time === '07h:45-08h:00') return `<tr class="time"><th>${time}</th><th colspan="5"><strong>National Anthem</strong></th></tr>`;
    if (specialSlots[time] === 'break-split') return `<tr class="break"><th>${time}</th><th colspan="2">Break (20mns)</th><th colspan="2">Break (20mns)</th></tr>`;
    if (specialSlots[time] === 'break') { const breakText = time === '11h:30-12h:10' ? 'Lunch Break (40mns)' : 'Break (10mns)'; return `<tr class="break"><th>${time}</th><th colspan="5">${breakText}</th></tr>`; }

    return `<tr class="subject"><th>${time}</th>${days.map((day) => {
      if (day === 'Wednesday' && (time === '08h:00-09h:30' || time === '09h:50-11h:30')) {
        if (time === '08h:00-09h:30' && !wednesdaySeminarRendered) { wednesdaySeminarRendered = true; return `<td class="rowspan" rowspan="3">SEMINAR</td>`; }
        if (wednesdaySeminarRendered && time !== '11h:30-12h:10') return '';
      }
      const items = dayMap[day];
      if (!items || items.length === 0) {
        const customText = customCells?.[time]?.[day];
        const fallbackText = String(defaultEmptyCellText || '').trim();
        const displayText = customText && String(customText).trim() ? customText : fallbackText;
        if (displayText) { const safeText = String(displayText).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); return `<td><p style="color:#555;font-style:italic;font-size:10px;padding:4px 6px;">${safeText}</p></td>`; }
        return `<td></td>`;
      }
      return `<td>${renderCellItems(items)}</td>`;
    }).join('')}</tr>`;
  }).join('');
}

async function buildScheduleHTMLFromCourseMappings({ academicYear, majorId, specializationId, groupIds, customCellsByGroup, defaultEmptyCellText, departmentId }) {
  const templateHTML = await loadScheduleTemplateHTML();
  const allTimeSlots = await TimeSlot.findAll({ order: [['order_index', 'ASC']] });

  const where = { status: 'Accepted', lecturer_profile_id: { [Op.ne]: null }, availability: { [Op.ne]: null } };
  if (academicYear) where.academic_year = academicYear;
  if (Array.isArray(groupIds) && groupIds.length) where.group_id = { [Op.in]: groupIds };
  if (departmentId) where.dept_id = departmentId;

  let majorFilterAbbr = '';
  if (majorId) { const major = await Major.findByPk(majorId); majorFilterAbbr = majorAbbreviation(major?.name); }

  const groupNameWhere = majorFilterAbbr ? { [Op.or]: [{ name: majorFilterAbbr }, { name: { [Op.like]: `${majorFilterAbbr}-%` } }] } : undefined;
  const specIdNum = safeInt(specializationId);
  const classWhere = specIdNum ? { specialization_id: specIdNum } : undefined;

  const mappings = await CourseMapping.findAll({
    where,
    include: [
      { model: ClassModel, attributes: ['id', 'name', 'term', 'year_level', 'academic_year', 'specialization_id', 'start_term'], required: !!classWhere, where: classWhere, include: [{ model: Specialization, attributes: ['id', 'name'], required: false, include: [{ model: Department, attributes: ['dept_name'], required: false }] }] },
      { model: Group, attributes: ['id', 'name', 'num_of_student'], required: true, where: groupNameWhere },
      { model: Course, attributes: ['course_name', 'course_code'], required: false },
      { model: LecturerProfile, attributes: ['title', 'full_name_english'], required: false },
    ],
    order: [['group_id', 'ASC'], ['course_id', 'ASC'], ['id', 'ASC']],
  });

  if (!mappings.length) return { html: '', groupCount: 0, mappingCount: 0 };

  const allScheduleItems = mappings.flatMap((mapping) => collectCourseMappingScheduleItems({ mapping, groupId: mapping?.group_id, groupName: mapping?.Group?.name }));

  const mappingsByGroupId = new Map();
  for (const mapping of mappings) { const gid = mapping?.group_id; if (!gid) continue; if (!mappingsByGroupId.has(gid)) mappingsByGroupId.set(gid, []); mappingsByGroupId.get(gid).push(mapping); }

  const groupIdsOrdered = Array.from(mappingsByGroupId.keys()).sort((a, b) => a - b);
  const persistedCustomCellsByGroup = await loadCustomCellsByGroup(groupIdsOrdered);
  const pages = groupIdsOrdered.map((gid) => {
    const groupMappings = mappingsByGroupId.get(gid) || [];
    const first = groupMappings[0];
    const grp = first?.Group;
    const cls = first?.Class || grp?.Class;
    const spec = cls?.Specialization;

    const academic_year = academicYear || first?.academic_year || cls?.academic_year || 'N/A';
    const term = first?.term || cls?.term || 'N/A';
    const year_level = first?.year_level || cls?.year_level || 'N/A';
    const dept_name_val = spec?.Department?.dept_name || 'N/A';
    const class_name_val = cls?.name || 'N/A';
    const specialization_val = spec?.name || 'N/A';
    const group_name = compactGroupLabel(grp?.name || 'N/A');
    const num_of_student = grp?.num_of_student || 'N/A';
    const note = 'Auto-generated from accepted course mappings';
    const created_at = formatDate(new Date());
    const start_date = resolveScheduleStartDate({ classStartTerm: cls?.start_term, academicYear: academic_year });
    const entriesByTimeAndDay = buildEntriesByTimeAndDayForGroup({ allItems: allScheduleItems, pageGroupId: gid });
    const groupCustomCells = customCellsByGroup?.[String(gid)] ?? customCellsByGroup?.[gid] ?? persistedCustomCellsByGroup?.[String(gid)] ?? null;
    const rowsHTML = buildTimetableRowsHTML({ allTimeSlots, entriesByTimeAndDay, customCells: groupCustomCells, defaultEmptyCellText });

    return templateHTML
      .replaceAll('{start_date}', start_date || '').replaceAll('{academic_year}', academic_year || '').replaceAll('{term}', term || '').replaceAll('{year_level}', year_level || '')
      .replaceAll('{dept_name}', dept_name_val || '').replaceAll('{class_name}', class_name_val || '').replaceAll('{specialization}', specialization_val || '').replaceAll('{group_name}', group_name || '')
      .replaceAll('{num_of_student}', String(num_of_student) || '').replaceAll('{note}', note || '').replaceAll('{created_at}', created_at || '').replaceAll('{schedule_rows}', rowsHTML);
  });

  const combinedBodyContent = pages.map((pageHTML, index) => { const bodyMatch = pageHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i); const bodyContent = bodyMatch ? bodyMatch[1] : pageHTML; return index < pages.length - 1 ? bodyContent + '<div style="page-break-after: always;"></div>' : bodyContent; }).join('');
  const headMatch = pages[0].match(/<head[^>]*>([\s\S]*)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : '';
  const finalHTML = `<!doctype html><html lang="en"><head>${headContent}</head><body>${combinedBodyContent}</body></html>`;
  return { html: finalHTML, groupCount: pages.length, mappingCount: mappings.length };
}

// ---------------------------------------------------------------------------
// Exported service functions
// ---------------------------------------------------------------------------

export async function getSchedulesData({ userId, userRole, query }) {
  const { class_name, dept_name, specialization, group_id } = query;
  const groupId = safeInt(group_id);
  const userRoleLc = String(userRole || '').toLowerCase();
  const adminDepartment = await resolveAdminDepartment({ userRole, departmentName: query?.admin_dept || query?.dept_name_admin });

  const effectiveDeptName = isAdminRole(userRole)
    ? String(adminDepartment?.dept_name || '').trim()
    : String(dept_name || '').trim();

  if (isAdminRole(userRole) && !effectiveDeptName) return { schedules: [], message: 'Schedule retrieved successfully.' };

  let lecturerProfileId = null;
  if (userRoleLc === 'lecturer') {
    const profile = await LecturerProfile.findOne({ where: { user_id: userId }, attributes: ['id'] });
    if (!profile) return { schedules: [], message: 'Schedule retrieved successfully.' };
    lecturerProfileId = profile.id;
  }

  const rows = await Schedule.findAll({
    where: groupId ? { group_id: groupId } : undefined,
    attributes: ['id', 'group_id', 'notes', 'custom_cells', 'start_date', 'created_at'],
    include: [
      {
        model: Group,
        attributes: ['id', 'name', 'num_of_student'],
        required: true,
        include: [
          { model: CourseMapping, attributes: [], required: Boolean(lecturerProfileId), where: lecturerProfileId ? { lecturer_profile_id: lecturerProfileId } : undefined },
          {
            model: ClassModel,
            attributes: ['name', 'start_term', 'end_term'],
            required: !!class_name || !!specialization || !!effectiveDeptName,
            where: class_name ? { name: class_name } : undefined,
            include: [{ model: Specialization, attributes: ['name'], required: !!specialization || !!effectiveDeptName, where: specialization ? { name: specialization } : undefined, include: [{ model: Department, attributes: ['dept_name'], required: !!effectiveDeptName, where: effectiveDeptName ? { dept_name: effectiveDeptName } : undefined }] }],
          },
        ],
      },
    ],
  });

  const seenScheduleIds = new Set();
  const schedules = rows.filter((schedule) => { if (seenScheduleIds.has(schedule.id)) return false; seenScheduleIds.add(schedule.id); return true; });
  return { schedules, message: 'Schedule retrieved successfully.' };
}

export async function getScheduleByIdData({ id, userRole, departmentName }) {
  const adminDepartment = isAdminRole(userRole) ? await resolveAdminDepartment({ userRole, departmentName }) : null;

  const schedule = await Schedule.findByPk(id, {
    include: [
      { model: Group, include: [{ model: ClassModel, include: [{ model: Specialization, include: [{ model: Department }] }] }] },
      { model: ScheduleEntry, include: [{ model: CourseMapping, include: [{ model: Course }, { model: LecturerProfile }] }, { model: TimeSlot }] },
    ],
  });

  if (!schedule) throw new NotFoundError('Schedule not found', { payload: { message: 'Schedule not found' } });

  if (isAdminRole(userRole)) {
    const scheduleDeptName = String(schedule.Group?.Class?.Specialization?.Department?.dept_name || '').trim();
    const adminDeptName = String(adminDepartment?.dept_name || '').trim();
    if (!adminDeptName || scheduleDeptName !== adminDeptName) throw new NotFoundError('Schedule not found', { payload: { message: 'Schedule not found' } });
  }

  return { schedule, message: 'Schedule retrieved successfully.' };
}

export async function createScheduleData({ group_id, name, notes, custom_cells, start_date }) {
  if (!group_id) throw new ValidationError('Required group_id', { payload: { message: 'Required group_id' } });
  if (!name) throw new ValidationError('Required name', { payload: { message: 'Required name' } });

  const group = await Group.findByPk(group_id);
  if (!group) throw new NotFoundError('Group not found', { payload: { message: 'Group not found' } });

  const existingSchedule = await Schedule.findOne({ where: { group_id } });
  if (existingSchedule) {
    const { ConflictError } = await import('../utils/errors.js');
    throw new ConflictError('Schedule already exists', {
      payload: { message: 'A schedule already exists for this group', existing_schedule_id: existingSchedule.id, existing_schedule_name: existingSchedule.name },
    });
  }

  const schedule = await Schedule.create({ group_id, name, notes, custom_cells: custom_cells !== undefined ? stringifyCustomCells(custom_cells) : null, start_date });
  return { schedule, message: 'Schedule created successfully.' };
}

export async function updateScheduleData({ id, name, notes, custom_cells, start_date }) {
  const schedule = await Schedule.findByPk(id);
  if (!schedule) throw new NotFoundError('Schedule not found', { payload: { message: 'Schedule not found' } });
  await schedule.update({ name: name || schedule.name, notes: notes !== undefined ? notes : schedule.notes, custom_cells: custom_cells !== undefined ? stringifyCustomCells(custom_cells) : schedule.custom_cells, start_date: start_date || schedule.start_date });
  return { message: 'Schedule updated successfully', schedule };
}

export async function deleteScheduleData(id) {
  const schedule = await Schedule.findByPk(id);
  if (!schedule) throw new NotFoundError('Schedule not found', { payload: { message: 'Schedule not found' } });
  await schedule.destroy();
  return { message: 'Schedule and all entries deleted successfully' };
}

export async function generateFilteredSchedulePDFData({ class_name, dept_name, specialization }) {
  const htmlPath = path.join(process.cwd(), 'src', 'utils', 'schedule.html');
  const scheduleHTML = embedIdtLogo(fs.readFileSync(htmlPath, 'utf8'));
  const allTimeSlots = await TimeSlot.findAll({ order: [['order_index', 'ASC']] });

  const scheduleEntries = await ScheduleEntry.findAll({
    attributes: ['id', 'schedule_id', 'day_of_week', 'room', 'session_type'],
    include: [
      { model: TimeSlot, attributes: ['label', 'order_index'], required: false },
      { model: CourseMapping, attributes: ['id', 'class_id', 'group_id', 'course_id', 'lecturer_profile_id', 'academic_year', 'year_level', 'term', 'status', 'availability', 'availability_assignments', 'room_number', 'theory_room_number', 'lab_room_number', 'theory_groups', 'lab_groups'], required: true, where: { status: 'Accepted' }, include: [{ model: Course, attributes: ['course_name', 'course_code'], required: false }, { model: LecturerProfile, attributes: ['id', 'title', 'full_name_english'], required: false }, { model: ClassModel, attributes: ['id', 'name', 'start_term'], required: false, include: [{ model: Specialization, attributes: ['name'], required: false, include: [{ model: Department, attributes: ['dept_name'], required: false }] }] }] },
      { model: Schedule, attributes: ['id', 'name', 'notes', 'start_date', 'created_at'], required: false, include: [{ model: Group, attributes: ['id', 'name', 'num_of_student'], required: false, include: [{ model: ClassModel, attributes: ['name', 'start_term'], required: false, include: [{ model: Specialization, attributes: ['name'], required: false, include: [{ model: Department, attributes: ['dept_name'], required: false }] }] }] }] },
    ],
  });

  if (scheduleEntries.length === 0) throw new NotFoundError('No schedule found', { payload: { message: 'No schedule found' } });

  const filteredEntries = scheduleEntries.filter((entry) => {
    const classDetails = entry.CourseMapping?.Class || entry.Schedule?.Group?.Class;
    let matches = true;
    if (class_name && classDetails?.name !== class_name) matches = false;
    if (dept_name && classDetails?.Specialization?.Department?.dept_name !== dept_name) matches = false;
    if (specialization && classDetails?.Specialization?.name !== specialization) matches = false;
    return matches;
  });

  if (filteredEntries.length === 0) throw new NotFoundError('No schedule data found', { payload: { message: 'No schedule data found matching the criteria' } });

  const entriesBySchedule = {};
  filteredEntries.forEach((entry) => { const scheduleId = entry.schedule_id; if (scheduleId) { if (!entriesBySchedule[scheduleId]) entriesBySchedule[scheduleId] = []; entriesBySchedule[scheduleId].push(entry); } });
  const scheduleIds = Object.keys(entriesBySchedule);
  if (scheduleIds.length === 0) throw new NotFoundError('No valid schedules found', { payload: { message: 'No valid schedules found in data' } });

  const allScheduleItems = filteredEntries.flatMap((entry) => collectCourseMappingScheduleItems({ mapping: entry.CourseMapping, groupId: entry.Schedule?.Group?.id, groupName: entry.Schedule?.Group?.name, day: entry.day_of_week, timeLabel: entry.TimeSlot?.label, fallbackRoom: entry.room, fallbackSessionType: entry.session_type }));

  const generateScheduleHTML = (entries) => {
    const firstEntry = entries[0];
    const cm = firstEntry.CourseMapping;
    const scheduleContainer = firstEntry.Schedule;
    const classDetails = cm?.Class || scheduleContainer?.Group?.Class;
    const academic_year = cm?.academic_year || 'N/A';
    const term = cm?.term || 'N/A';
    const year_level = cm?.year_level || 'N/A';
    const dept_name_val = classDetails?.Specialization?.Department?.dept_name || 'N/A';
    const class_name_val = classDetails?.name || 'N/A';
    const group_name = compactGroupLabel(scheduleContainer?.Group?.name || 'N/A');
    const num_of_student = scheduleContainer?.Group?.num_of_student || 'N/A';
    const specialization_val = classDetails?.Specialization?.name || 'N/A';
    const note = scheduleContainer?.notes || 'N/A';
    const created_at = formatDate(scheduleContainer?.created_at);
    const start_date = resolveScheduleStartDate({ classStartTerm: classDetails?.start_term, scheduleStartDate: scheduleContainer?.start_date, academicYear: academic_year });
    const grouped = buildEntriesByTimeAndDayForGroup({ allItems: allScheduleItems, pageGroupId: scheduleContainer?.Group?.id });
    const rowsHTML = buildTimetableRowsHTML({ allTimeSlots, entriesByTimeAndDay: grouped });
    return scheduleHTML.replaceAll('{start_date}', start_date || '').replaceAll('{academic_year}', academic_year || '').replaceAll('{term}', term || '').replaceAll('{year_level}', year_level || '').replaceAll('{dept_name}', dept_name_val || '').replaceAll('{class_name}', class_name_val || '').replaceAll('{specialization}', specialization_val || '').replaceAll('{group_name}', group_name || '').replaceAll('{num_of_student}', String(num_of_student) || '').replaceAll('{note}', note || '').replaceAll('{created_at}', created_at || '').replaceAll('{schedule_rows}', rowsHTML);
  };

  const pageContents = scheduleIds.map((scheduleId) => generateScheduleHTML(entriesBySchedule[scheduleId]));
  const combinedBodyContent = pageContents.map((pageHTML, index) => { const bodyMatch = pageHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i); const bodyContent = bodyMatch ? bodyMatch[1] : pageHTML; return index < pageContents.length - 1 ? bodyContent + '<div style="page-break-after: always;"></div>' : bodyContent; }).join('');
  const firstPageHTML = pageContents[0];
  const headMatch = firstPageHTML.match(/<head[^>]*>([\s\S]*)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : '';
  const finalHTML = `<!doctype html><html lang="en"><head>${headContent}</head><body>${combinedBodyContent}</body></html>`;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(finalHTML, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', landscape: true, printBackground: true, margin: { top: '40px', bottom: '40px', left: '20px', right: '20px' } });
  await browser.close();
  return { pdfBuffer };
}

export async function generateFilteredScheduleHTMLData({ body, userRole, departmentName }) {
  const academicYear = String(body?.academic_year || '').trim();
  const majorId = safeInt(body?.major_id);
  const specializationId = safeInt(body?.specialization_id);
  const groupIdsRaw = Array.isArray(body?.group_ids) ? body.group_ids : [];
  const groupIds = groupIdsRaw.map(safeInt).filter(Boolean);
  const defaultEmptyCellText = String(body?.empty_cell_text || '').trim();
  const adminDepartment = await resolveAdminDepartment({ userRole, departmentName });

  if (isAdminRole(userRole) && !adminDepartment?.id) {
    throw new ForbiddenError('Access denied: admin department not found', { payload: { message: 'Access denied: admin department not found' } });
  }

  const customCellsByGroup = body?.custom_cells_by_group || null;
  const customCellGroupIds = Object.keys(customCellsByGroup || {}).map(safeInt).filter(Boolean);
  const submittedGroupIds = Array.from(new Set([...groupIds, ...customCellGroupIds]));

  if (isAdminRole(userRole) && submittedGroupIds.length) {
    const allowedGroupIds = await listAuthorizedGroupIdsForDepartment(adminDepartment?.dept_name, submittedGroupIds);
    if (allowedGroupIds.length !== submittedGroupIds.length) {
      throw new ForbiddenError('Access denied: one or more groups are outside your department', { payload: { message: 'Access denied: one or more groups are outside your department' } });
    }
  }

  const sanitizedCustomCellsByGroup = customCellsByGroup && typeof customCellsByGroup === 'object'
    ? Object.fromEntries(Object.entries(customCellsByGroup).filter(([groupIdKey]) => { const groupId = safeInt(groupIdKey); return groupId && (!groupIds.length || groupIds.includes(groupId)); }))
    : null;

  if (sanitizedCustomCellsByGroup && typeof sanitizedCustomCellsByGroup === 'object') {
    await saveCustomCellsByGroup(sanitizedCustomCellsByGroup);
  }

  const { html, groupCount, mappingCount } = await buildScheduleHTMLFromCourseMappings({ academicYear: academicYear || null, majorId, specializationId, groupIds, customCellsByGroup: sanitizedCustomCellsByGroup, defaultEmptyCellText, departmentId: adminDepartment?.id || null });

  if (!html) throw new NotFoundError('No accepted course mappings found', { payload: { message: 'No accepted course mappings found for the given filters' } });

  const dir = ensureUploadsScheduleDir();
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const filename = `schedule-${uniqueId}.html`;
  const outputPath = path.join(dir, filename);
  fs.writeFileSync(outputPath, html, 'utf8');

  return { message: 'Schedule HTML generated and saved', file: path.join('uploads', 'schedules', filename), filename, groupCount, mappingCount };
}

export async function generateSchedulePDFFromSavedHTMLData({ file: requestedFile }) {
  const { filePath, error, status } = resolveGeneratedScheduleHtmlPath(requestedFile);
  if (!filePath) throw new ValidationError(error || 'Invalid schedule HTML file.', { payload: { message: error }, statusCode: status || 400 });

  const html = fs.readFileSync(filePath, 'utf8');
  const finalHTML = embedIdtLogo(html);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(finalHTML, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', landscape: true, printBackground: true, margin: { top: '40px', bottom: '40px', left: '20px', right: '20px' } });
  await browser.close();
  return { pdfBuffer };
}
