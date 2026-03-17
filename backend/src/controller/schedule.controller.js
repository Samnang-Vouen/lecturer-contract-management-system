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

// Helper to embed idt_logo.png as base64 in HTML
function embedIdtLogo(html) {
  const logoPath = path.join(process.cwd(), 'src', 'utils', 'idt-logo-blue.png');
  let base64 = '';
  try {
    base64 = fs.readFileSync(logoPath, 'base64');
  } catch {}
  return html.replace('src="idt-logo-blue.png"', `src="data:image/png;base64,${base64}"`);
}

function safeInt(value) {
  const n = parseInt(String(value ?? ''), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseCustomCells(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function stringifyCustomCells(value) {
  try {
    return JSON.stringify(value && typeof value === 'object' ? value : {});
  } catch {
    return '{}';
  }
}

async function saveCustomCellsByGroup(customCellsByGroup) {
  const entries = Object.entries(customCellsByGroup || {});
  if (!entries.length) return;

  for (const [groupIdKey, cellMap] of entries) {
    const groupId = safeInt(groupIdKey);
    if (!groupId) continue;

    const serialized = stringifyCustomCells(cellMap);
    const existing = await Schedule.findOne({
      where: { group_id: groupId },
      order: [['created_at', 'DESC']],
    });
    if (existing) {
      await existing.update({ custom_cells: serialized });
      continue;
    }

    await Schedule.create({
      group_id: groupId,
      name: `Auto Schedule Group ${groupId}`,
      notes: null,
      custom_cells: serialized,
      start_date: null,
    });
  }
}

async function loadCustomCellsByGroup(groupIds) {
  if (!Array.isArray(groupIds) || !groupIds.length) return {};

  const rows = await Schedule.findAll({
    where: { group_id: { [Op.in]: groupIds } },
    attributes: ['group_id', 'custom_cells', 'created_at'],
    order: [
      ['group_id', 'ASC'],
      ['created_at', 'DESC'],
    ],
  });

  return rows.reduce((acc, row) => {
    const gid = row?.group_id;
    if (!gid) return acc;
    const key = String(gid);
    // Because rows are ordered by created_at DESC, the first row for each group_id
    // is the most recent schedule; keep the first and ignore subsequent ones.
    if (!(key in acc)) {
      acc[key] = parseCustomCells(row?.custom_cells);
    }
    return acc;
  }, {});
}

function isAcceptedStatus(status) {
  return String(status || '').trim().toLowerCase() === 'accepted';
}

function startDateFromAcademicYear(academicYear) {
  const m = String(academicYear || '').match(/(\d{4})\s*-\s*(\d{4})/);
  if (!m) return null;
  // Align with Course Mapping schedule backfill behavior
  return `${m[1]}-10-01`;
}

function majorAbbreviation(majorName) {
  const name = String(majorName || '').trim();
  if (!name) return '';
  const canonical = name.toLowerCase();
  const map = {
    'software engineering': 'SE',
    'data science': 'DS',
    'digital business': 'DB',
    'telecom and networking engineering': 'TNE',
    'cyber security': 'CS',
    cybersecurity: 'CS',
  };
  if (map[canonical]) return map[canonical];

  // Fallback: initials
  return name
    .replace(/\([^)]*\)/g, '')
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

async function loadScheduleTemplateHTML() {
  const htmlPath = path.join(process.cwd(), 'src', 'utils', 'schedule.html');
  let scheduleHTML = fs.readFileSync(htmlPath, 'utf8');
  return embedIdtLogo(scheduleHTML);
}

function ensureUploadsScheduleDir() {
  const dirPath = path.join(process.cwd(), 'uploads', 'schedules');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

function resolveGeneratedScheduleHtmlPath(requestedFile) {
  const dirPath = ensureUploadsScheduleDir();

  if (requestedFile) {
    const safeFilename = path.basename(String(requestedFile).trim());
    if (!safeFilename.toLowerCase().endsWith('.html')) {
      return { error: 'Invalid file parameter. Expected an .html file.' };
    }

    const filePath = path.join(dirPath, safeFilename);
    if (!fs.existsSync(filePath)) {
      return { error: 'Specified schedule HTML file not found. Generate HTML first.', status: 404 };
    }

    return { filePath };
  }

  const htmlFiles = fs
    .readdirSync(dirPath)
    .filter((name) => name.toLowerCase().endsWith('.html'))
    .map((name) => {
      const filePath = path.join(dirPath, name);
      return {
        filePath,
        mtimeMs: fs.statSync(filePath).mtimeMs,
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (!htmlFiles.length) {
    return { error: 'No generated schedule HTML file found. Generate HTML first.', status: 404 };
  }

  return { filePath: htmlFiles[0].filePath };
}

function formatDate(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const day = date.getDate();
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  const getOrdinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return `${getOrdinal(day)} ${month}, ${year}`;
}

function resolveScheduleStartDate({ classStartTerm, scheduleStartDate, academicYear }) {
  if (classStartTerm) {
    return formatDate(classStartTerm);
  }
  if (scheduleStartDate) {
    return formatDate(scheduleStartDate);
  }
  return formatDate(startDateFromAcademicYear(academicYear) || new Date());
}

function baseGroupName(groupName) {
  const raw = String(groupName || '').trim();
  if (!raw) return '';
  return raw.replace(/[-\s]*G\d+$/i, '').trim() || raw;
}

function formatGroupLabel(groupName, groupNumber) {
  const raw = String(groupName || '').trim();
  if (raw && /(^|[-\s])G\d+$/i.test(raw)) return raw;
  const n = parseInt(String(groupNumber || ''), 10);
  if (!Number.isInteger(n) || n <= 0) return raw;
  if (new RegExp(`(^|[-\\s])G${n}$`, 'i').test(raw)) return raw;
  const base = baseGroupName(raw);
  return `${base || raw || 'Group'}-G${n}`;
}

function compareGroupLabels(left, right) {
  const leftValue = String(left || '').trim();
  const rightValue = String(right || '').trim();
  const leftNumber = parseInt(leftValue.match(/G(\d+)$/i)?.[1] || '', 10);
  const rightNumber = parseInt(rightValue.match(/G(\d+)$/i)?.[1] || '', 10);

  if (Number.isInteger(leftNumber) && Number.isInteger(rightNumber) && leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }

  return leftValue.localeCompare(rightValue);
}

function roomForSessionType(mapping, sessionType, fallbackRoom) {
  if (sessionType === 'Theory') {
    return mapping?.theory_room_number || mapping?.room_number || fallbackRoom || 'TBA';
  }
  if (sessionType === 'Lab') {
    return mapping?.lab_room_number || mapping?.room_number || fallbackRoom || 'TBA';
  }
  return mapping?.room_number || mapping?.theory_room_number || mapping?.lab_room_number || fallbackRoom || 'TBA';
}

function sessionLabelForDisplay(sessionType) {
  if (sessionType === 'Theory') return 'Theory Class';
  if (sessionType === 'Lab') return 'Lab Class';
  return sessionType || 'Class';
}

function formatLecturerDisplayName(title, fullName) {
  const normalizedTitle = String(title || '').trim();
  const normalizedName = String(fullName || '').trim();
  if (!normalizedTitle) return normalizedName;
  if (!normalizedName) return normalizedTitle;

  const titleToken = normalizedTitle.replace(/\./g, '').toLowerCase();
  const namePrefix = normalizedName.split(/\s+/)[0]?.replace(/\./g, '').toLowerCase() || '';
  if (titleToken && namePrefix === titleToken) {
    return normalizedName;
  }

  return `${normalizedTitle}. ${normalizedName}`;
}

function fallbackGroupLabels(mapping, sessionType, groupName) {
  const count =
    sessionType === 'Lab'
      ? Number(mapping?.lab_groups || 0)
      : sessionType === 'Theory'
        ? Number(mapping?.theory_groups || 0)
        : 0;

  if (count <= 0) return [];

  return Array.from({ length: count }, (_, index) => formatGroupLabel(groupName, index + 1)).filter(Boolean);
}

function collectCourseMappingScheduleItems({
  mapping,
  groupId,
  groupName,
  day,
  timeLabel,
  fallbackRoom,
  fallbackSessionType,
}) {
  const lecturerTitle = mapping?.LecturerProfile?.title || '';
  const lecturerName = mapping?.LecturerProfile?.full_name_english || '';
  const courseName = mapping?.Course?.course_name || 'Unknown Course';
  const items = [];
  const assignments = Array.isArray(mapping?.availability_assignments)
    ? mapping.availability_assignments
    : [];

  for (const assignment of assignments) {
    const sessionType = String(assignment?.groupType || '').toUpperCase() === 'LAB' ? 'Lab' : 'Theory';
    const groupLabel = formatGroupLabel(groupName, assignment?.groupNumber);
    const room = roomForSessionType(mapping, sessionType, fallbackRoom);

    for (const assignedSession of Array.isArray(assignment?.assignedSessions)
      ? assignment.assignedSessions
      : []) {
      const assignedDay = normalizeDay(assignedSession?.day);
      const sessionCode = normalizeSession(assignedSession?.session);
      const assignedTimeLabel = SESSION_TO_RANGE[sessionCode]?.timeSlot;
      if (!assignedDay || !assignedTimeLabel) continue;
      if (day && assignedDay !== day) continue;
      if (timeLabel && assignedTimeLabel !== timeLabel) continue;

      items.push({
        groupId,
        classId: mapping?.class_id || mapping?.Class?.id || null,
        courseId: mapping?.course_id || mapping?.Course?.id || null,
        lecturerProfileId: mapping?.lecturer_profile_id || mapping?.LecturerProfile?.id || null,
        day: assignedDay,
        timeLabel: assignedTimeLabel,
        courseName,
        lecturerTitle,
        lecturerName,
        room,
        sessionType,
        groupLabels: groupLabel ? [groupLabel] : [],
      });
    }
  }

  if (items.length) return items;

  const sessionType = fallbackSessionType || computeSessionType(mapping);
  const groupLabels = fallbackGroupLabels(mapping, sessionType, groupName);
  const room = roomForSessionType(mapping, sessionType, fallbackRoom);
  const parsedSessions = parseAvailability(mapping?.availability)
    .filter((session) => (!day || session?.day === day) && (!timeLabel || session?.timeSlot === timeLabel));

  if (parsedSessions.length) {
    return parsedSessions.map((session) => ({
      groupId,
      classId: mapping?.class_id || mapping?.Class?.id || null,
      courseId: mapping?.course_id || mapping?.Course?.id || null,
      lecturerProfileId: mapping?.lecturer_profile_id || mapping?.LecturerProfile?.id || null,
      day: session.day,
      timeLabel: session.timeSlot,
      courseName,
      lecturerTitle,
      lecturerName,
      room,
      sessionType,
      groupLabels,
    }));
  }

  if (day && timeLabel) {
    return [
      {
        groupId,
        classId: mapping?.class_id || mapping?.Class?.id || null,
        courseId: mapping?.course_id || mapping?.Course?.id || null,
        lecturerProfileId: mapping?.lecturer_profile_id || mapping?.LecturerProfile?.id || null,
        day,
        timeLabel,
        courseName,
        lecturerTitle,
        lecturerName,
        room,
        sessionType,
        groupLabels,
      },
    ];
  }

  return [];
}

function mergeSessionTypes(sessionTypes) {
  const types = Array.from(sessionTypes || []).filter(Boolean);
  if (types.includes('Theory') && types.includes('Lab')) return 'Theory + Lab';
  return types[0] || 'Class';
}

function buildEntriesByTimeAndDayForGroup({ allItems, pageGroupId }) {
  const mergedItems = new Map();

  for (const item of Array.isArray(allItems) ? allItems : []) {
    const mergeKey = [
      item?.day || '',
      item?.timeLabel || '',
      item?.classId || '',
      item?.courseId || '',
      item?.lecturerProfileId || '',
      item?.room || '',
    ].join('||');

    if (!mergedItems.has(mergeKey)) {
      mergedItems.set(mergeKey, {
        ...item,
        groupIds: new Set(),
        groupLabels: new Set(),
        sessionTypes: new Set(),
      });
    }

    const current = mergedItems.get(mergeKey);
    if (item?.groupId != null) current.groupIds.add(item.groupId);
    if (item?.sessionType) current.sessionTypes.add(item.sessionType);
    for (const groupLabel of Array.isArray(item?.groupLabels) ? item.groupLabels : []) {
      if (groupLabel) current.groupLabels.add(groupLabel);
    }
  }

  const entriesByTimeAndDay = {};
  for (const current of mergedItems.values()) {
    if (!current.groupIds.has(pageGroupId)) continue;
    if (!entriesByTimeAndDay[current.timeLabel]) entriesByTimeAndDay[current.timeLabel] = {};
    if (!entriesByTimeAndDay[current.timeLabel][current.day]) entriesByTimeAndDay[current.timeLabel][current.day] = [];

    entriesByTimeAndDay[current.timeLabel][current.day].push({
      ...current,
      sessionType: mergeSessionTypes(current.sessionTypes),
      groupLabels: Array.from(current.groupLabels).sort(compareGroupLabels),
    });
  }

  return entriesByTimeAndDay;
}

function computeSessionType(mapping) {
  const theoryGroups = Number(mapping?.theory_groups || 0);
  const labGroups = Number(mapping?.lab_groups || 0);
  return theoryGroups > 0 && labGroups > 0 ? 'Lab + Theory' : labGroups > 0 ? 'Lab' : 'Theory';
}

function computeRoom(mapping) {
  return mapping?.theory_room_number || mapping?.lab_room_number || mapping?.room_number || 'TBA';
}

function buildTimetableRowsHTML({ allTimeSlots, entriesByTimeAndDay, customCells, defaultEmptyCellText }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const specialSlots = {
    '07h:45-08h:00': 'national-anthem',
    '09h:30-09h:50': 'break-split',
    '11h:30-12h:10': 'break',
    '13h:40-13h:50': 'break',
    '15h:20-15h:30': 'break',
  };

  let wednesdaySeminarRendered = false;

  const renderCellItems = (items) => {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return '';
    const mergedItems = Array.from(
      list.reduce((acc, item) => {
        const key = [
          item?.courseName || '',
          item?.lecturerTitle || '',
          item?.lecturerName || '',
          item?.room || '',
          item?.sessionType || '',
        ].join('||');
        if (!acc.has(key)) {
          acc.set(key, {
            ...item,
            groupLabels: [],
          });
        }
        const current = acc.get(key);
        for (const groupLabel of Array.isArray(item?.groupLabels) ? item.groupLabels : []) {
          if (groupLabel && !current.groupLabels.includes(groupLabel)) {
            current.groupLabels.push(groupLabel);
          }
        }
        return acc;
      }, new Map()).values()
    );

    return mergedItems
      .map((it) => {
        const lecturer = formatLecturerDisplayName(it?.lecturerTitle, it?.lecturerName);
        const sessionLabel = sessionLabelForDisplay(it?.sessionType);
        const groupText = Array.isArray(it?.groupLabels) && it.groupLabels.length ? it.groupLabels.join(' + ') : '';

        return `
          <div style="margin: 6px 0;">
            <p class="class">(${sessionLabel})${groupText ? ` (${groupText})` : ''}</p>
            <p><strong>${it?.courseName || ''}</strong></p>
            <p>${lecturer || ''}</p>
            <p class="class">Room: ${it?.room || 'TBA'}</p>
          </div>
        `;
      })
      .join('');
  };

  return allTimeSlots
    .map((timeSlot) => {
      const time = timeSlot.label;
      const dayMap = entriesByTimeAndDay[time] || {};

      if (time === '07h:45-08h:00') {
        return `
          <tr class="time">
            <th>${time}</th>
            <th colspan="5"><strong>National Anthem</strong></th>
          </tr>`;
      }

      if (specialSlots[time] === 'break-split') {
        return `
          <tr class="break">
            <th>${time}</th>
            <th colspan="2">Break (20mns)</th>
            <th colspan="2">Break (20mns)</th>
          </tr>`;
      }

      if (specialSlots[time] === 'break') {
        const breakText = time === '11h:30-12h:10' ? 'Lunch Break (40mns)' : 'Break (10mns)';
        return `
          <tr class="break">
            <th>${time}</th>
            <th colspan="5">${breakText}</th>
          </tr>`;
      }

      return `
        <tr class="subject">
          <th>${time}</th>
          ${days
            .map((day) => {
              if (
                day === 'Wednesday' &&
                (time === '08h:00-09h:30' || time === '09h:50-11h:30')
              ) {
                if (time === '08h:00-09h:30' && !wednesdaySeminarRendered) {
                  wednesdaySeminarRendered = true;
                  return `<td class="rowspan" rowspan="3">SEMINAR</td>`;
                }
                if (wednesdaySeminarRendered && time !== '11h:30-12h:10') {
                  return '';
                }
              }

              const items = dayMap[day];
              if (!items || items.length === 0) {
                const customText = customCells?.[time]?.[day];
                const fallbackText = String(defaultEmptyCellText || '').trim();
                const displayText = customText && String(customText).trim() ? customText : fallbackText;
                if (displayText) {
                  const safeText = String(displayText)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                  return `<td><p style="color:#555;font-style:italic;font-size:10px;padding:4px 6px;">${safeText}</p></td>`;
                }
                return `<td></td>`;
              }
              return `<td>${renderCellItems(items)}</td>`;
            })
            .join('')}
        </tr>
      `;
    })
    .join('');
}

async function buildScheduleHTMLFromCourseMappings({ academicYear, majorId, specializationId, groupIds, customCellsByGroup, defaultEmptyCellText }) {
  const templateHTML = await loadScheduleTemplateHTML();
  const allTimeSlots = await TimeSlot.findAll({ order: [['order_index', 'ASC']] });

  const where = {
    status: 'Accepted',
    lecturer_profile_id: { [Op.ne]: null },
    availability: { [Op.ne]: null },
  };
  if (academicYear) where.academic_year = academicYear;
  if (Array.isArray(groupIds) && groupIds.length) where.group_id = { [Op.in]: groupIds };

  let majorFilterAbbr = '';
  if (majorId) {
    const major = await Major.findByPk(majorId);
    majorFilterAbbr = majorAbbreviation(major?.name);
  }

  const groupNameWhere = majorFilterAbbr
    ? {
        [Op.or]: [
          { name: majorFilterAbbr },
          { name: { [Op.like]: `${majorFilterAbbr}-%` } },
        ],
      }
    : undefined;

  const specIdNum = safeInt(specializationId);
  const classWhere = specIdNum ? { specialization_id: specIdNum } : undefined;

  const mappings = await CourseMapping.findAll({
    where,
    include: [
      {
        model: ClassModel,
        attributes: ['id', 'name', 'term', 'year_level', 'academic_year', 'specialization_id', 'start_term'],
        required: !!classWhere,
        where: classWhere,
        include: [
          {
            model: Specialization,
            attributes: ['id', 'name'],
            required: false,
            include: [
              {
                model: Department,
                attributes: ['dept_name'],
                required: false,
              },
            ],
          },
        ],
      },
      {
        model: Group,
        attributes: ['id', 'name', 'num_of_student'],
        required: true,
        where: groupNameWhere,
        include: [],
      },
      { model: Course, attributes: ['course_name', 'course_code'], required: false },
      { model: LecturerProfile, attributes: ['title', 'full_name_english'], required: false },
    ],
    order: [
      ['group_id', 'ASC'],
      ['course_id', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  if (!mappings.length) {
    return { html: '', groupCount: 0, mappingCount: 0 };
  }

  const allScheduleItems = mappings.flatMap((mapping) =>
    collectCourseMappingScheduleItems({
      mapping,
      groupId: mapping?.group_id,
      groupName: mapping?.Group?.name,
    })
  );

  const mappingsByGroupId = new Map();
  for (const mapping of mappings) {
    const gid = mapping?.group_id;
    if (!gid) continue;
    if (!mappingsByGroupId.has(gid)) mappingsByGroupId.set(gid, []);
    mappingsByGroupId.get(gid).push(mapping);
  }

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
    const group_name = grp?.name || 'N/A';
    const num_of_student = grp?.num_of_student || 'N/A';
    const note = 'Auto-generated from accepted course mappings';
    const created_at = formatDate(new Date());
    const start_date = resolveScheduleStartDate({
      classStartTerm: cls?.start_term,
      academicYear: academic_year,
    });

    const entriesByTimeAndDay = buildEntriesByTimeAndDayForGroup({
      allItems: allScheduleItems,
      pageGroupId: gid,
    });

    const groupCustomCells =
      customCellsByGroup?.[String(gid)] ??
      customCellsByGroup?.[gid] ??
      persistedCustomCellsByGroup?.[String(gid)] ??
      null;
    const rowsHTML = buildTimetableRowsHTML({
      allTimeSlots,
      entriesByTimeAndDay,
      customCells: groupCustomCells,
      defaultEmptyCellText,
    });

    return templateHTML
      .replaceAll('{start_date}', start_date || '')
      .replaceAll('{academic_year}', academic_year || '')
      .replaceAll('{term}', term || '')
      .replaceAll('{year_level}', year_level || '')
      .replaceAll('{dept_name}', dept_name_val || '')
      .replaceAll('{class_name}', class_name_val || '')
      .replaceAll('{specialization}', specialization_val || '')
      .replaceAll('{group_name}', group_name || '')
      .replaceAll('{num_of_student}', String(num_of_student) || '')
      .replaceAll('{note}', note || '')
      .replaceAll('{created_at}', created_at || '')
      .replaceAll('{schedule_rows}', rowsHTML);
  });

  const combinedBodyContent = pages
    .map((pageHTML, index) => {
      const bodyMatch = pageHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyContent = bodyMatch ? bodyMatch[1] : pageHTML;
      if (index < pages.length - 1) {
        return bodyContent + '<div style="page-break-after: always;"></div>';
      }
      return bodyContent;
    })
    .join('');

  const headMatch = pages[0].match(/<head[^>]*>([\s\S]*)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : '';

  const finalHTML = `<!doctype html>
    <html lang="en">
      <head>${headContent}</head>
      <body>${combinedBodyContent}</body>
    </html>`;

  return { html: finalHTML, groupCount: pages.length, mappingCount: mappings.length };
}

// GET /api/schedules - Get all timetable containers
export const getSchedules = async (req, res) => {
  try {
    const { class_name, dept_name, specialization, group_id } = req.query;
    const groupId = safeInt(group_id);

    const schedules = await Schedule.findAll({
      where: groupId ? { group_id: groupId } : undefined,
      attributes: ['id', 'group_id', 'notes', 'custom_cells', 'start_date', 'created_at'],
      include: [
        {
          model: Group,
          attributes: ['id', 'name', 'num_of_student'],
          required: true,
          include: [
            {
              model: ClassModel,
              attributes: ['name'],
              required: !!class_name || !!specialization || !!dept_name,
              where: class_name ? { name: class_name } : undefined,
              include: [
                {
                  model: Specialization,
                  attributes: ['name'],
                  required: !!specialization || !!dept_name,
                  where: specialization ? { name: specialization } : undefined,
                  include: [
                    {
                      model: Department,
                      attributes: ['dept_name'],
                      required: !!dept_name,
                      where: dept_name ? { dept_name } : undefined,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      schedules,
      message: 'Schedule retrieved successfully.',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// GET /api/schedules/:id - Get timetable with all entries
export const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByPk(id, {
      include: [
        {
          model: Group,
          include: [
            {
              model: ClassModel,
              include: [
                {
                  model: Specialization,
                  include: [
                    {
                      model: Department,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: ScheduleEntry,
          include: [
            {
              model: CourseMapping,
              include: [{ model: Course }, { model: LecturerProfile }],
            },
            {
              model: TimeSlot,
            },
          ],
        },
      ],
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    return res.status(200).json({ schedule, message: 'Schedule retrieved successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// POST /api/schedules - Create a new timetable container
export const createSchedule = async (req, res) => {
  try {
    const { group_id, name, notes, custom_cells, start_date } = req.body;

    if (!group_id) {
      return res.status(400).json({ message: 'Required group_id' });
    }
    if (!name) {
      return res.status(400).json({ message: 'Required name' });
    }

    // Verify group exists
    const group = await Group.findByPk(group_id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if schedule already exists for this group
    const existingSchedule = await Schedule.findOne({
      where: { group_id },
    });

    if (existingSchedule) {
      return res.status(409).json({
        message: 'A schedule already exists for this group',
        existing_schedule_id: existingSchedule.id,
        existing_schedule_name: existingSchedule.name,
      });
    }

    const schedule = await Schedule.create({
      group_id,
      name,
      notes,
      custom_cells: custom_cells !== undefined ? stringifyCustomCells(custom_cells) : null,
      start_date,
    });

    return res.status(201).json({ schedule, message: 'Schedule created successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// PUT /api/schedules/:id - Update timetable container
export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, notes, custom_cells, start_date } = req.body;

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    await schedule.update({
      name: name || schedule.name,
      notes: notes !== undefined ? notes : schedule.notes,
      custom_cells:
        custom_cells !== undefined
          ? stringifyCustomCells(custom_cells)
          : schedule.custom_cells,
      start_date: start_date || schedule.start_date,
    });

    res.json({ message: 'Schedule updated successfully', schedule });
  } catch (err) {
    console.error('[UpdateSchedule]', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// DELETE /api/schedules/:id - Delete timetable (cascades to entries)
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // This will cascade delete all schedule entries due to onDelete: 'CASCADE'
    await schedule.destroy();

    res.json({ message: 'Schedule and all entries deleted successfully' });
  } catch (err) {
    console.error('[DeleteSchedule]', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// GET /api/schedules/pdf - Generate PDF with filters (class_name, dept_name, specialization)
export const generateFilteredSchedulePDF = async (req, res) => {
  let browser;
  try {
    const { class_name, dept_name, specialization } = req.query;

    const htmlPath = path.join(process.cwd(), 'src', 'utils', 'schedule.html');
    let scheduleHTML = fs.readFileSync(htmlPath, 'utf8');
    scheduleHTML = embedIdtLogo(scheduleHTML);

    const allTimeSlots = await TimeSlot.findAll({
      order: [['order_index', 'ASC']],
    });

    const scheduleEntries = await ScheduleEntry.findAll({
      attributes: ['id', 'schedule_id', 'day_of_week', 'room', 'session_type'],
      include: [
        {
          model: TimeSlot,
          attributes: ['label', 'order_index'],
          required: false,
        },
        {
          model: CourseMapping,
          attributes: [
            'id',
            'class_id',
            'group_id',
            'course_id',
            'lecturer_profile_id',
            'academic_year',
            'year_level',
            'term',
            'status',
            'availability',
            'availability_assignments',
            'room_number',
            'theory_room_number',
            'lab_room_number',
            'theory_groups',
            'lab_groups',
          ],
          required: true,
          where: { status: 'Accepted' },
          include: [
            { model: Course, attributes: ['course_name', 'course_code'], required: false },
            {
              model: LecturerProfile,
              attributes: ['id', 'title', 'full_name_english'],
              required: false,
            },
            {
              model: ClassModel,
              attributes: ['id', 'name', 'start_term'],
              required: false,
              include: [
                {
                  model: Specialization,
                  attributes: ['name'],
                  required: false,
                  include: [
                    {
                      model: Department,
                      attributes: ['dept_name'],
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: Schedule,
          attributes: ['id', 'name', 'notes', 'start_date', 'created_at'],
          required: false,
          include: [
            {
              model: Group,
              attributes: ['id', 'name', 'num_of_student'],
              required: false,
              include: [
                {
                  model: ClassModel,
                  attributes: ['name', 'start_term'],
                  required: false,
                  include: [
                    {
                      model: Specialization,
                      attributes: ['name'],
                      required: false,
                      include: [
                        {
                          model: Department,
                          attributes: ['dept_name'],
                          required: false,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    if (scheduleEntries.length === 0) {
      return res.status(404).json({ message: 'No schedule found' });
    }

    // Filter schedule entries based on query parameters
    let filteredEntries = scheduleEntries.filter((entry) => {
      const classDetails = entry.CourseMapping?.Class || entry.Schedule?.Group?.Class;
      const className = classDetails?.name;
      const deptName = classDetails?.Specialization?.Department?.dept_name;
      const specName = classDetails?.Specialization?.name;

      let matches = true;

      if (class_name && className !== class_name) {
        matches = false;
      }
      if (dept_name && deptName !== dept_name) {
        matches = false;
      }
      if (specialization && specName !== specialization) {
        matches = false;
      }

      return matches;
    });

    if (filteredEntries.length === 0) {
      return res.status(404).json({ message: 'No schedule data found matching the criteria' });
    }

    // Group entries by schedule_id
    const entriesBySchedule = {};
    filteredEntries.forEach((entry) => {
      const scheduleId = entry.schedule_id;
      if (scheduleId) {
        if (!entriesBySchedule[scheduleId]) {
          entriesBySchedule[scheduleId] = [];
        }
        entriesBySchedule[scheduleId].push(entry);
      }
    });

    const scheduleIds = Object.keys(entriesBySchedule);

    if (scheduleIds.length === 0) {
      return res.status(404).json({ message: 'No valid schedules found in data' });
    }

    const allScheduleItems = filteredEntries.flatMap((entry) =>
      collectCourseMappingScheduleItems({
        mapping: entry.CourseMapping,
        groupId: entry.Schedule?.Group?.id,
        groupName: entry.Schedule?.Group?.name,
        day: entry.day_of_week,
        timeLabel: entry.TimeSlot?.label,
        fallbackRoom: entry.room,
        fallbackSessionType: entry.session_type,
      })
    );

    const generateScheduleHTML = (entries) => {
      const firstEntry = entries[0];
      const cm = firstEntry.CourseMapping;
      const scheduleContainer = firstEntry.Schedule;
      const classFromCourseMapping = cm?.Class;
      const classDetails = classFromCourseMapping || scheduleContainer?.Group?.Class;

      const academic_year = cm?.academic_year || 'N/A';
      const term = cm?.term || 'N/A';
      const year_level = cm?.year_level || 'N/A';
      const dept_name_val = classDetails?.Specialization?.Department?.dept_name || 'N/A';
      const class_name_val = classDetails?.name || 'N/A';
      const group_name = scheduleContainer?.Group?.name || 'N/A';
      const num_of_student = scheduleContainer?.Group?.num_of_student || 'N/A';
      const specialization_val = classDetails?.Specialization?.name || 'N/A';
      const note = scheduleContainer?.notes || 'N/A';

      const created_at = formatDate(scheduleContainer?.created_at);
      const start_date = resolveScheduleStartDate({
        classStartTerm: classDetails?.start_term,
        scheduleStartDate: scheduleContainer?.start_date,
        academicYear: academic_year,
      });

      const grouped = buildEntriesByTimeAndDayForGroup({
        allItems: allScheduleItems,
        pageGroupId: scheduleContainer?.Group?.id,
      });

      const rowsHTML = buildTimetableRowsHTML({ allTimeSlots, entriesByTimeAndDay: grouped });

      return scheduleHTML
        .replaceAll('{start_date}', start_date || '')
        .replaceAll('{academic_year}', academic_year || '')
        .replaceAll('{term}', term || '')
        .replaceAll('{year_level}', year_level || '')
        .replaceAll('{dept_name}', dept_name_val || '')
        .replaceAll('{class_name}', class_name_val || '')
        .replaceAll('{specialization}', specialization_val || '')
        .replaceAll('{group_name}', group_name || '')
        .replaceAll('{num_of_student}', String(num_of_student) || '')
        .replaceAll('{note}', note || '')
        .replaceAll('{created_at}', created_at || '')
        .replaceAll('{schedule_rows}', rowsHTML);
    };

    const pageContents = scheduleIds.map((scheduleId) => {
      return generateScheduleHTML(entriesBySchedule[scheduleId]);
    });

    const combinedBodyContent = pageContents
      .map((pageHTML, index) => {
        const bodyMatch = pageHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const bodyContent = bodyMatch ? bodyMatch[1] : pageHTML;

        if (index < pageContents.length - 1) {
          return bodyContent + '<div style="page-break-after: always;"></div>';
        }
        return bodyContent;
      })
      .join('');

    const firstPageHTML = pageContents[0];
    const headMatch = firstPageHTML.match(/<head[^>]*>([\s\S]*)<\/head>/i);
    const headContent = headMatch ? headMatch[1] : '';

    const finalHTML = `<!doctype html>
      <html lang="en">
        <head>${headContent}</head>
        <body>${combinedBodyContent}</body>
      </html>`;

    browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(finalHTML, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '40px', bottom: '40px', left: '20px', right: '20px' },
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
  } finally {
    if (browser) await browser.close();
  }
};

// POST /api/schedules/generate-html
// Generates schedule HTML from accepted CourseMappings, saves it as a unique file (e.g. uploads/schedules/schedule-<id>.html),
// and returns `file`/`filename` that must be used in the subsequent PDF generation request.
export const generateFilteredScheduleHTML = async (req, res) => {
  try {
    const academicYear = String(req.body?.academic_year || '').trim();
    const majorId = safeInt(req.body?.major_id);
    const specializationId = safeInt(req.body?.specialization_id);
    const groupIdsRaw = Array.isArray(req.body?.group_ids) ? req.body.group_ids : [];
    const groupIds = groupIdsRaw.map(safeInt).filter(Boolean);
    const defaultEmptyCellText = String(req.body?.empty_cell_text || '').trim();

    const customCellsByGroup = req.body?.custom_cells_by_group || null;
    if (customCellsByGroup && typeof customCellsByGroup === 'object') {
      await saveCustomCellsByGroup(customCellsByGroup);
    }
    const { html, groupCount, mappingCount } = await buildScheduleHTMLFromCourseMappings({
      academicYear: academicYear || null,
      majorId,
      specializationId,
      groupIds,
      customCellsByGroup,
      defaultEmptyCellText,
    });

    if (!html) {
      return res.status(404).json({ message: 'No accepted course mappings found for the given filters' });
    }

    const dir = ensureUploadsScheduleDir();
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const filename = `schedule-${uniqueId}.html`;
    const outputPath = path.join(dir, filename);
    fs.writeFileSync(outputPath, html, 'utf8');

    return res.status(200).json({
      message: 'Schedule HTML generated and saved',
      // Relative path that the client can use to request the PDF later
      file: path.join('uploads', 'schedules', filename),
      filename,
      groupCount,
      mappingCount,
    });
  } catch (err) {
    console.error('[generateFilteredScheduleHTML]', err);
    return res.status(500).json({ message: 'Failed to generate schedule HTML', error: err.message });
  }
};

// GET /api/schedules/generated-pdf
// Converts the last generated uploads/schedules/schedule.html to PDF.
export const generateSchedulePDFFromSavedHTML = async (req, res) => {
  let browser;
  try {
    const requestedFile = String(req.query?.file || '').trim();
    const { filePath, error, status } = resolveGeneratedScheduleHtmlPath(requestedFile);
    if (!filePath) {
      return res.status(status || 400).json({ message: error || 'Invalid schedule HTML file.' });
    }

    const html = fs.readFileSync(filePath, 'utf8');
    const finalHTML = embedIdtLogo(html);

    browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(finalHTML, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '40px', bottom: '40px', left: '20px', right: '20px' },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="all-schedules.pdf"');
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('[generateSchedulePDFFromSavedHTML]', err);
    return res.status(500).json({ message: 'Failed to convert schedule HTML to PDF', error: err.message });
  } finally {
    if (browser) await browser.close();
  }
};
