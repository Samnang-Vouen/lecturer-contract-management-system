import ClassModel from '../model/class.model.js';
import Course from '../model/course.model.js';
import { LecturerProfile, Department, Schedule, CourseMapping } from '../model/index.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { TimeSlot } from '../model/timeSlot.model.js';

// GET /schedule
export const getSchedule = async (req, res) => {
  try {
    const { dept_name } = req.query;

    // Build where clause for CourseMapping -> Department
    const departmentWhere = dept_name ? { dept_name } : {};

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
        },
        {
          model: CourseMapping,
          attributes: ['id'],
          include: [
            {
              model: Department,
              attributes: ['dept_name'],
              where: departmentWhere,
              required: dept_name ? true : false,
            },
            {
              model: ClassModel,
              attributes: ['name', 'academic_year', 'year_level', 'term'],
            },
            { model: Course, attributes: ['course_name'] },
            { model: LecturerProfile, attributes: ['title', 'full_name_english'] },
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
  const htmlPath = path.join(process.cwd(), 'src', 'utils', 'schedule.html');
  let scheduleHTML = fs.readFileSync(htmlPath, 'utf8');
  scheduleHTML = embedIdtLogo(scheduleHTML);

  try {
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
      ],
      include: [
        {
          model: TimeSlot,
          attributes: ['label'],
          required: false,
        },
        {
          model: CourseMapping,
          attributes: ['id'],
          required: false,
          include: [
            { model: Department, attributes: ['dept_name'], required: false },
            {
              model: ClassModel,
              attributes: ['name', 'academic_year', 'year_level', 'term'],
              required: false,
            },
            { model: Course, attributes: ['course_name'], required: false },
            { model: LecturerProfile, attributes: ['title', 'full_name_english'], required: false },
          ],
        },
      ],
    });

    if (schedule.length === 0) {
      return res.status(404).json({ message: 'No schedule data found in database' });
    }

    // Extract metadata from first schedule item
    const firstSchedule = schedule[0];
    const cm = firstSchedule.CourseMapping;
    const academic_year = cm?.Class?.academic_year || 'N/A';
    const term = cm?.Class?.term || 'N/A';
    const year_level = cm?.Class?.year_level || 'N/A';
    const dept_name = cm?.Department?.dept_name || 'N/A';
    const class_name = cm?.Class?.name || 'N/A';
    const note = firstSchedule.notes;

    // Format date as "dd mm, yyyy"
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

    schedule.forEach((s) => {
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

        // Handle National Anthem
        if (time === '07h:45-08h:00') {
          return `
          <tr class="time">
            <th>${time}</th>
            <th colspan="5"><strong>National Anthem</strong></th>
          </tr>`;
        }

        // Handle breaks
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

        // Regular subject row
        return `
          <tr class="subject">
            <th>${time}</th>
            ${days
              .map((day) => {
                // Wednesday seminar handling (from 08h:00 to 11h:30)
                if (day === 'Wednesday' && (time === '08h:00-09h:30' || time === '09h:50-11h:30')) {
                  if (time === '08h:00-09h:30' && !wednesdaySeminarRendered) {
                    wednesdaySeminarRendered = true;
                    return `<td class="rowspan" rowspan="3">SEMINAR</td>`;
                  }
                  // Skip rendering for other Wednesday times in the seminar block
                  if (wednesdaySeminarRendered && time !== '11h:30-12h:10') {
                    return '';
                  }
                }

                const s = dayMap[day];
                if (!s) return `<td></td>`;

                // Check if CourseMapping data exists
                if (
                  !s.CourseMapping ||
                  !s.CourseMapping.Course ||
                  !s.CourseMapping.LecturerProfile
                ) {
                  console.warn('Missing CourseMapping data for schedule:', s.id);
                  return `<td></td>`;
                }

                // Regular class session
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

    scheduleHTML = scheduleHTML
      .replaceAll('{start_date}', start_date)
      .replaceAll('{academic_year}', academic_year)
      .replaceAll('{term}', term)
      .replaceAll('{year_level}', year_level)
      .replaceAll('{dept_name}', dept_name)
      .replaceAll('{class_name}', class_name)
      .replaceAll('{note}', note)
      .replaceAll('{created_at}', created_at)
      .replaceAll('{schedule_rows}', rowsHTML);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(scheduleHTML, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '40px', bottom: '40px', left: '20px', right: '20px' },
    });
    await browser.close();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation failed: ', err);
    return res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
  }
};
