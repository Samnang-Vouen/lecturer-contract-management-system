import ClassModel from '../model/class.model.js';
import Course from '../model/course.model.js';
import { LecturerProfile, Department, Schedule, CourseMapping } from '../model/index.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { TimeSlot } from '../model/timeSlot.model.js';
import Specialization from '../model/specialization.model.js';
import Group from '../model/group.model.js';
import { availabilityToScheduleEntries } from '../utils/availabilityParser.js';
import { checkScheduleConflict } from '../utils/scheduleHelper.js';

// GET /schedule
export const getSchedule = async (req, res) => {
  try {
    const { class_name, dept_name, specialization } = req.query;

    const schedule = await Schedule.findAll({
      attributes: [
        'id',
        'day_of_week',
        'room',
        'session_type',
        'notes',
        'start_date',
        'created_at',
      ],
      include: [
        {
          model: TimeSlot,
          attributes: ['label'],
          required: true,
        },
        {
          model: CourseMapping,
          attributes: ['id'],
          required: true,
          include: [
            { model: Course, attributes: ['course_name'] },
            { model: LecturerProfile, attributes: ['title', 'full_name_english'] },
            {
              model: Group,
              attributes: ['name', 'num_of_student'],
              required: true,
              include: [
                {
                  model: ClassModel,
                  attributes: ['name', 'academic_year', 'year_level', 'term'],
                  where: class_name ? { name: class_name } : undefined,
                  required: class_name ? true : false,
                  include: [
                    {
                      model: Specialization,
                      attributes: ['name'],
                      where: specialization ? { name: specialization } : undefined,
                      required: specialization ? true : false,
                      include: [
                        {
                          model: Department,
                          attributes: ['dept_name'],
                          where: dept_name ? { dept_name } : undefined,
                          required: dept_name ? true : false,
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

    return res.status(200).json({
      schedule,
      message: 'Schedule retrieved successfully',
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Helper to embed idt_logo.png as base64 in HTML
function embedIdtLogo(html) {
  const logoPath = path.join(process.cwd(), 'src', 'utils', 'idt.png');
  let base64 = '';
  try {
    base64 = fs.readFileSync(logoPath, 'base64');
  } catch {}
  return html.replace('src="idt.png"', `src="data:image/png;base64,${base64}"`);
}

// GET /schedule/pdf
export const generateSchedulePDF = async (req, res) => {
  let browser;
  try {
    const { class_name, dept_name, specialization } = req.query;

    const htmlPath = path.join(process.cwd(), 'src', 'utils', 'schedule.html');
    let scheduleHTML = fs.readFileSync(htmlPath, 'utf8');
    scheduleHTML = embedIdtLogo(scheduleHTML);

    const allTimeSlots = await TimeSlot.findAll({
      order: [['order_index', 'ASC']],
    });

    const schedule = await Schedule.findAll({
      attributes: [
        'id',
        'day_of_week',
        'room',
        'session_type',
        'notes',
        'start_date',
        'created_at',
        'course_mapping_id',
      ],
      include: [
        {
          model: TimeSlot,
          attributes: ['label'],
          required: false,
        },
        {
          model: CourseMapping,
          attributes: ['id', 'group_id', 'course_id', 'lecturer_profile_id'],
          required: false,
          include: [
            { model: Course, attributes: ['course_name'], required: false },
            {
              model: LecturerProfile,
              attributes: ['title', 'full_name_english'],
              required: false,
            },
            {
              model: Group,
              attributes: ['name', 'num_of_student', 'class_id'],
              required: false,
              include: [
                {
                  model: ClassModel,
                  attributes: [
                    'name',
                    'academic_year',
                    'year_level',
                    'term',
                    'specialization_id',
                    'dept_id',
                  ],
                  required: false,
                  include: [
                    {
                      model: Specialization,
                      attributes: ['name', 'dept_id'],
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

    if (schedule.length === 0) {
      return res.status(404).json({ message: 'No schedule data found in database' });
    }

    // Filter schedules based on query parameters
    let filteredSchedule = schedule.filter((s) => {
      const className = s.CourseMapping?.Group?.Class?.name;
      const deptName = s.CourseMapping?.Group?.Class?.Specialization?.Department?.dept_name;
      const specName = s.CourseMapping?.Group?.Class?.Specialization?.name;

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

    if (filteredSchedule.length === 0) {
      return res.status(404).json({ message: 'No schedule data found matching the criteria' });
    }

    // Group schedules by group name
    const schedulesByGroup = {};
    filteredSchedule.forEach((s) => {
      const groupName = s.CourseMapping?.Group?.name;
      if (groupName) {
        if (!schedulesByGroup[groupName]) {
          schedulesByGroup[groupName] = [];
        }
        schedulesByGroup[groupName].push(s);
      }
    });

    const groupNames = Object.keys(schedulesByGroup);

    if (groupNames.length === 0) {
      return res.status(404).json({ message: 'No valid groups found in schedule data' });
    }

    const generateGroupHTML = (groupSchedules) => {
      const firstSchedule = groupSchedules[0];
      const cm = firstSchedule.CourseMapping;

      const academic_year = cm?.Group?.Class?.academic_year || 'N/A';
      const term = cm?.Group?.Class?.term || 'N/A';
      const year_level = cm?.Group?.Class?.year_level || 'N/A';
      const dept_name = cm?.Group?.Class?.Specialization?.Department?.dept_name || 'N/A';
      const class_name = cm?.Group?.Class?.name || 'N/A';
      const group_name = cm?.Group?.name || 'N/A';
      const num_of_student = cm?.Group?.num_of_student || 'N/A';
      const specialization = cm?.Group?.Class?.Specialization?.name || 'N/A';
      const note = firstSchedule.notes || 'N/A';

      const formatDate = (dateString) => {
        const date = new Date(dateString);
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

        // Add ordinal suffix
        const getOrdinal = (n) => {
          const s = ['th', 'st', 'nd', 'rd'];
          const v = n % 100;
          return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };

        return `${getOrdinal(day)} ${month}, ${year}`;
      };

      const created_at = formatDate(firstSchedule.created_at);
      const start_date = formatDate(firstSchedule.start_date);

      const grouped = {};

      groupSchedules.forEach((s) => {
        if (!s.TimeSlot || !s.TimeSlot.label) return;
        const key = s.TimeSlot.label;
        if (!grouped[key]) grouped[key] = {};
        grouped[key][s.day_of_week] = s;
      });

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

      const specialSlots = {
        '07h:45-08h:00': 'national-anthem',
        '09h:30-09h:50': 'break-split',
        '11h:30-12h:10': 'break',
        '13h:40-13h:50': 'break',
        '15h:20-15h:30': 'break',
      };

      let wednesdaySeminarRendered = false;

      const rowsHTML = allTimeSlots
        .map((timeSlot) => {
          const time = timeSlot.label;
          const dayMap = grouped[time] || {};

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

                  const s = dayMap[day];
                  if (!s) return `<td></td>`;

                  if (
                    !s.CourseMapping ||
                    !s.CourseMapping.Course ||
                    !s.CourseMapping.LecturerProfile
                  ) {
                    return `<td></td>`;
                  }

                  const sessionLabel =
                    s.session_type === 'Theory'
                      ? 'Theory Class | G1+G2'
                      : s.session_type === 'Lab'
                        ? 'Lab Class'
                        : 'Theory + Lab';

                  return `
                  <td>
                    <p class="class">(${sessionLabel})</p>
                    <p><strong>${s.CourseMapping.Course.course_name}</strong></p>
                    <p>${s.CourseMapping.LecturerProfile.title}. ${s.CourseMapping.LecturerProfile.full_name_english}</p>
                    <p class="class">Room: ${s.room}</p>
                  </td>
                `;
                })
                .join('')}
            </tr>
          `;
        })
        .join('');

      let pageHTML = scheduleHTML
        .replaceAll('{start_date}', start_date || '')
        .replaceAll('{academic_year}', academic_year || '')
        .replaceAll('{term}', term || '')
        .replaceAll('{year_level}', year_level || '')
        .replaceAll('{dept_name}', dept_name || '')
        .replaceAll('{class_name}', class_name || '')
        .replaceAll('{specialization}', specialization || '')
        .replaceAll('{group_name}', group_name || '')
        .replaceAll('{num_of_student}', String(num_of_student) || '')
        .replaceAll('{note}', note || '')
        .replaceAll('{created_at}', created_at || '')
        .replaceAll('{schedule_rows}', rowsHTML);

      return pageHTML;
    };

    const pageContents = groupNames.map((groupName) => {
      return generateGroupHTML(schedulesByGroup[groupName]);
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

    const browser = await puppeteer.launch();
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
    console.error('PDF generation failed: ', err);
    return res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
  } finally {
    if (browser) await browser.close();
  }
};

// POST /schedule
export const createSchedule = async (req, res) => {
  try {
    const { course_mapping_id, time_slot_id, start_date, day_of_week, room, session_type, notes } =
      req.body;

    if (!start_date) return res.status(400).json({ message: 'Required start_date' });
    if (!room) return res.status(400).json({ message: 'Required room' });
    if (!session_type) return res.status(400).json({ message: 'Required session_type' });
    if (!course_mapping_id) return res.status(400).json({ message: 'Required course_mapping_id' });
    if (!day_of_week) return res.status(400).json({ message: 'Required day_of_week' });
    if (!time_slot_id) return res.status(400).json({ message: 'Required time_slot_id' });

    const courseMapping = await CourseMapping.findByPk(course_mapping_id);
    if (!courseMapping) {
      return res.status(404).json({ message: 'Course mapping not found' });
    }

    // Validate against availability if set
    if (courseMapping.availability) {
      const scheduleEntries = await availabilityToScheduleEntries(
        courseMapping.availability,
        TimeSlot
      );
      const isValidSchedule = scheduleEntries.some(
        (entry) => entry.day_of_week === day_of_week && entry.time_slot_id === time_slot_id
      );

      if (!isValidSchedule) {
        const requestedTimeSlot = await TimeSlot.findByPk(time_slot_id);
        const timeSlotLabel = requestedTimeSlot ? requestedTimeSlot.label : time_slot_id;

        return res.status(400).json({
          message: `Invalid schedule: ${day_of_week} at ${timeSlotLabel} is not in the course availability.`,
          availability: courseMapping.availability,
          requested: { day: day_of_week, time_slot: timeSlotLabel },
          hint: 'The schedule must match one of the sessions defined in the course mapping availability.',
        });
      }
    }

    // Check for conflicts
    const conflictCheck = await checkScheduleConflict(
      course_mapping_id,
      time_slot_id,
      day_of_week,
      room
    );

    if (conflictCheck.hasError) {
      return res.status(conflictCheck.error.status).json({ message: conflictCheck.error.message });
    }

    if (conflictCheck.hasConflict) {
      return res.status(conflictCheck.conflict.status).json({
        message: conflictCheck.conflict.message,
        conflict: conflictCheck.conflict.details,
      });
    }

    // Create the schedule
    const schedule = await Schedule.create({
      course_mapping_id,
      time_slot_id,
      day_of_week,
      room,
      session_type,
      notes,
      start_date,
    });

    return res.status(201).json({ schedule, message: 'Schedule created successfully' });
  } catch (err) {
    console.log('[CreateSchedule]', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// PUT /schedule:id
export const editSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findByPk(id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const { course_mapping_id, time_slot_id, start_date, day_of_week, room, session_type, notes } =
      req.body;

    if (!start_date) return res.status(400).json({ message: 'Required start_date' });
    if (!day_of_week) return res.status(400).json({ message: 'Required day_of_week' });
    if (!room) return res.status(400).json({ message: 'Required room' });
    if (!session_type) return res.status(400).json({ message: 'Required session_type' });

    const mappingId = course_mapping_id || schedule.course_mapping_id;
    const slotId = time_slot_id || schedule.time_slot_id;

    // Fetch course mapping to validate availability
    const courseMapping = await CourseMapping.findByPk(mappingId);
    if (!courseMapping) {
      return res.status(404).json({ message: 'Course mapping not found' });
    }

    // Validate against availability if set
    if (courseMapping.availability) {
      const scheduleEntries = await availabilityToScheduleEntries(
        courseMapping.availability,
        TimeSlot
      );
      const isValidSchedule = scheduleEntries.some(
        (entry) => entry.day_of_week === day_of_week && entry.time_slot_id === slotId
      );

      if (!isValidSchedule) {
        const requestedTimeSlot = await TimeSlot.findByPk(slotId);
        const timeSlotLabel = requestedTimeSlot ? requestedTimeSlot.label : slotId;

        return res.status(400).json({
          message: `Invalid schedule: ${day_of_week} at ${timeSlotLabel} is not in the course availability.`,
          availability: courseMapping.availability,
          requested: { day: day_of_week, time_slot: timeSlotLabel },
          hint: 'The schedule must match one of the sessions defined in the course mapping availability.',
        });
      }
    }

    // Check if any conflict-worthy changes are being made
    const checkingConflict =
      (course_mapping_id && course_mapping_id !== schedule.course_mapping_id) ||
      (time_slot_id && time_slot_id !== schedule.time_slot_id) ||
      day_of_week !== schedule.day_of_week ||
      room !== schedule.room;

    if (checkingConflict) {
      // Check for conflicts (excluding current schedule)
      const conflictCheck = await checkScheduleConflict(
        mappingId,
        slotId,
        day_of_week,
        room,
        id
      );

      if (conflictCheck.hasError) {
        return res
          .status(conflictCheck.error.status)
          .json({ message: conflictCheck.error.message });
      }

      if (conflictCheck.hasConflict) {
        return res.status(conflictCheck.conflict.status).json({
          message: conflictCheck.conflict.message,
          conflict: conflictCheck.conflict.details,
        });
      }
    }

    await schedule.update({
      course_mapping_id: mappingId,
      time_slot_id: slotId,
      start_date,
      day_of_week,
      room,
      session_type,
      notes: notes !== undefined ? notes : schedule.notes,
    });

    return res.status(200).json({ schedule, message: 'Schedule updated successfully' });
  } catch (err) {
    console.log('[EditSchedule]', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// DELETE /schedule:id
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    await schedule.destroy();

    return res.status(200).json({
      message: 'Schedule deleted successfully',
    });
  } catch (err) {
    console.log('[DeleteSchedule]', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};
