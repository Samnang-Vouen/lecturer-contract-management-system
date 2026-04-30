import ClassModel from '../model/class.model.js';
import Course from '../model/course.model.js';
import {
  LecturerProfile,
  Department,
  ScheduleEntry,
  CourseMapping,
  Schedule,
} from '../model/index.js';
import { TimeSlot } from '../model/timeSlot.model.js';
import Specialization from '../model/specialization.model.js';
import Group from '../model/group.model.js';
import { availabilityToScheduleEntries } from '../utils/availabilityParser.js';
import { checkScheduleConflict } from '../utils/scheduleHelper.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// Service: getScheduleData
// ---------------------------------------------------------------------------

export async function getScheduleData({ userId, userRole, query }) {
  const { class_name, dept_name, specialization, schedule_id } = query;
  const normalizedRole = String(userRole || '').toLowerCase();

  const whereClause = {};
  if (schedule_id) whereClause.schedule_id = schedule_id;

  let lecturerProfileId = null;
  if (normalizedRole === 'lecturer') {
    const profile = await LecturerProfile.findOne({
      where: { user_id: userId },
      attributes: ['id'],
    });
    if (!profile) {
      return { schedule: [], message: 'Schedule entries retrieved successfully' };
    }
    lecturerProfileId = profile.id;
  }

  const schedule = await ScheduleEntry.findAll({
    where: whereClause,
    attributes: ['id', 'schedule_id', 'day_of_week', 'room', 'session_type', 'created_at'],
    include: [
      {
        model: TimeSlot,
        attributes: ['label', 'order_index'],
        required: true,
      },
      {
        model: CourseMapping,
        attributes: ['id', 'academic_year', 'year_level', 'term'],
        required: true,
        where: lecturerProfileId ? { lecturer_profile_id: lecturerProfileId } : undefined,
        include: [
          { model: Course, attributes: ['course_name', 'course_code'] },
          { model: LecturerProfile, attributes: ['title', 'full_name_english'] },
          {
            model: Group,
            attributes: ['name', 'num_of_student'],
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
      },
    ],
    order: [
      ['day_of_week', 'ASC'],
      [{ model: TimeSlot }, 'order_index', 'ASC'],
    ],
  });

  return { schedule, message: 'Schedule entries retrieved successfully' };
}

// ---------------------------------------------------------------------------
// Service: createScheduleEntryData
// ---------------------------------------------------------------------------

export async function createScheduleEntryData({
  schedule_id,
  course_mapping_id,
  time_slot_id,
  day_of_week,
  room,
  session_type,
}) {
  if (!schedule_id) {
    throw new ValidationError('Required schedule_id', { payload: { message: 'Required schedule_id' } });
  }
  if (!room) {
    throw new ValidationError('Required room', { payload: { message: 'Required room' } });
  }
  if (!session_type) {
    throw new ValidationError('Required session_type', { payload: { message: 'Required session_type' } });
  }
  if (!course_mapping_id) {
    throw new ValidationError('Required course_mapping_id', { payload: { message: 'Required course_mapping_id' } });
  }
  if (!day_of_week) {
    throw new ValidationError('Required day_of_week', { payload: { message: 'Required day_of_week' } });
  }
  if (!time_slot_id) {
    throw new ValidationError('Required time_slot_id', { payload: { message: 'Required time_slot_id' } });
  }

  const scheduleContainer = await Schedule.findByPk(schedule_id);
  if (!scheduleContainer) {
    throw new NotFoundError('Schedule not found', { payload: { message: 'Schedule not found' } });
  }

  const courseMapping = await CourseMapping.findByPk(course_mapping_id);
  if (!courseMapping) {
    throw new NotFoundError('Course mapping not found', { payload: { message: 'Course mapping not found' } });
  }

  if (
    scheduleContainer.group_id !== undefined &&
    courseMapping.group_id !== undefined &&
    scheduleContainer.group_id !== courseMapping.group_id
  ) {
    throw new ValidationError('Group mismatch', {
      payload: { message: 'Course mapping does not belong to the same group as the schedule container' },
    });
  }

  if (courseMapping.availability) {
    const scheduleEntries = await availabilityToScheduleEntries(courseMapping.availability, TimeSlot);
    const isValid = scheduleEntries.some(
      (e) => e.day_of_week === day_of_week && e.time_slot_id === time_slot_id
    );
    if (!isValid) {
      const requestedTimeSlot = await TimeSlot.findByPk(time_slot_id);
      const timeSlotLabel = requestedTimeSlot ? requestedTimeSlot.label : time_slot_id;
      throw new ValidationError('Availability mismatch', {
        payload: {
          message: `Invalid schedule: ${day_of_week} at ${timeSlotLabel} is not in the course availability.`,
          availability: courseMapping.availability,
          requested: { day: day_of_week, time_slot: timeSlotLabel },
          hint: 'The schedule must match one of the sessions defined in the course mapping availability.',
        },
      });
    }
  }

  const existingEntry = await ScheduleEntry.findOne({
    where: { schedule_id, day_of_week, time_slot_id },
    include: [{ model: TimeSlot, attributes: ['label'] }],
  });

  if (existingEntry) {
    const timeSlotLabel = existingEntry.TimeSlot?.label || time_slot_id;
    throw new ConflictError('Entry already exists', {
      payload: {
        message: `A schedule entry already exists for ${day_of_week} at ${timeSlotLabel} in this schedule.`,
        existing_entry_id: existingEntry.id,
      },
    });
  }

  const conflictCheck = await checkScheduleConflict(course_mapping_id, time_slot_id, day_of_week, room);

  if (conflictCheck.hasError) {
    throw new ValidationError(conflictCheck.error.message, {
      payload: { message: conflictCheck.error.message },
      statusCode: conflictCheck.error.status,
    });
  }
  if (conflictCheck.hasConflict) {
    throw new ConflictError(conflictCheck.conflict.message, {
      payload: { message: conflictCheck.conflict.message, conflict: conflictCheck.conflict.details },
    });
  }

  const entry = await ScheduleEntry.create({
    schedule_id,
    course_mapping_id,
    time_slot_id,
    day_of_week,
    room,
    session_type,
  });

  return { schedule: entry, message: 'Schedule entry created successfully' };
}

// ---------------------------------------------------------------------------
// Service: createBulkScheduleEntriesData
// ---------------------------------------------------------------------------

export async function createBulkScheduleEntriesData({ schedule_id, entries }) {
  const transaction = await sequelize.transaction();

  try {
    if (!schedule_id) {
      await transaction.rollback();
      throw new ValidationError('Required schedule_id', { payload: { message: 'Required schedule_id' } });
    }
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      await transaction.rollback();
      throw new ValidationError('Required entries', { payload: { message: 'Required entries array with at least one entry' } });
    }

    const scheduleContainer = await Schedule.findByPk(schedule_id);
    if (!scheduleContainer) {
      await transaction.rollback();
      throw new NotFoundError('Schedule not found', { payload: { message: 'Schedule not found' } });
    }

    const validationErrors = [];
    const entriesData = [];

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const errors = [];
      if (!entry.course_mapping_id) errors.push('course_mapping_id is required');
      if (!entry.day_of_week) errors.push('day_of_week is required');
      if (!entry.time_slot_id) errors.push('time_slot_id is required');
      if (!entry.room) errors.push('room is required');
      if (!entry.session_type) errors.push('session_type is required');
      if (errors.length > 0) { validationErrors.push({ index: i, entry, errors }); continue; }
      entriesData.push({ index: i, ...entry });
    }

    if (validationErrors.length > 0) {
      await transaction.rollback();
      throw new ValidationError('Validation failed', {
        payload: { message: 'Validation failed for some entries', errors: validationErrors },
      });
    }

    const duplicatesInRequest = [];
    for (let i = 0; i < entriesData.length; i += 1) {
      for (let j = i + 1; j < entriesData.length; j += 1) {
        if (
          entriesData[i].day_of_week === entriesData[j].day_of_week &&
          entriesData[i].time_slot_id === entriesData[j].time_slot_id
        ) {
          duplicatesInRequest.push({
            indices: [i, j],
            day_of_week: entriesData[i].day_of_week,
            time_slot_id: entriesData[i].time_slot_id,
          });
        }
      }
    }

    if (duplicatesInRequest.length > 0) {
      await transaction.rollback();
      throw new ValidationError('Duplicate entries', {
        payload: {
          message: 'Duplicate entries found within the request (same day and time slot)',
          duplicates: duplicatesInRequest,
        },
      });
    }

    const existingEntries = await ScheduleEntry.findAll({
      where: { schedule_id },
      attributes: ['day_of_week', 'time_slot_id', 'id'],
      include: [{ model: TimeSlot, attributes: ['label'] }],
      transaction,
    });

    const existingMap = new Map();
    existingEntries.forEach((e) => {
      existingMap.set(`${e.day_of_week}-${e.time_slot_id}`, {
        id: e.id,
        label: e.TimeSlot?.label || e.time_slot_id,
      });
    });

    const conflicts = [];
    for (let i = 0; i < entriesData.length; i += 1) {
      const entry = entriesData[i];
      const existing = existingMap.get(`${entry.day_of_week}-${entry.time_slot_id}`);
      if (existing) {
        conflicts.push({ index: i, day_of_week: entry.day_of_week, time_slot: existing.label, existing_entry_id: existing.id });
      }
    }

    if (conflicts.length > 0) {
      await transaction.rollback();
      throw new ConflictError('Slot conflicts', {
        payload: { message: 'Some entries conflict with existing schedule entries', conflicts },
      });
    }

    const courseMappingIds = [...new Set(entriesData.map((e) => e.course_mapping_id))];
    const courseMappings = await CourseMapping.findAll({ where: { id: courseMappingIds }, transaction });
    const courseMappingMap = new Map(courseMappings.map((cm) => [cm.id, cm]));

    const availabilityErrors = [];
    for (let i = 0; i < entriesData.length; i += 1) {
      const entry = entriesData[i];
      const cm = courseMappingMap.get(entry.course_mapping_id);
      if (!cm) {
        availabilityErrors.push({ index: i, error: `Course mapping ${entry.course_mapping_id} not found` });
        continue;
      }
      if (cm.availability) {
        const ses = await availabilityToScheduleEntries(cm.availability, TimeSlot);
        const isValid = ses.some((se) => se.day_of_week === entry.day_of_week && se.time_slot_id === entry.time_slot_id);
        if (!isValid) {
          const slot = await TimeSlot.findByPk(entry.time_slot_id, { transaction });
          availabilityErrors.push({
            index: i,
            error: `${entry.day_of_week} at ${slot?.label || entry.time_slot_id} is not in the course availability`,
            availability: cm.availability,
          });
        }
      }
    }

    if (availabilityErrors.length > 0) {
      await transaction.rollback();
      throw new ValidationError('Availability violations', {
        payload: { message: 'Some entries violate course availability constraints', errors: availabilityErrors },
      });
    }

    const conflictErrors = [];
    for (let i = 0; i < entriesData.length; i += 1) {
      const entry = entriesData[i];
      const check = await checkScheduleConflict(entry.course_mapping_id, entry.time_slot_id, entry.day_of_week, entry.room);
      if (check.hasError) {
        conflictErrors.push({ index: i, error: check.error.message });
      } else if (check.hasConflict) {
        conflictErrors.push({ index: i, error: check.conflict.message, conflict: check.conflict.details });
      }
    }

    if (conflictErrors.length > 0) {
      await transaction.rollback();
      throw new ConflictError('Lecturer/room conflicts', {
        payload: { message: 'Some entries have lecturer or room conflicts', errors: conflictErrors },
      });
    }

    const createdEntries = await ScheduleEntry.bulkCreate(
      entriesData.map((entry) => ({
        schedule_id,
        course_mapping_id: entry.course_mapping_id,
        time_slot_id: entry.time_slot_id,
        day_of_week: entry.day_of_week,
        room: entry.room,
        session_type: entry.session_type,
      })),
      { transaction }
    );

    await transaction.commit();
    return {
      message: `Successfully created ${createdEntries.length} schedule entries`,
      count: createdEntries.length,
      entries: createdEntries,
    };
  } catch (err) {
    if (!transaction.finished) await transaction.rollback();
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Service: editScheduleEntryData
// ---------------------------------------------------------------------------

export async function editScheduleEntryData(id, { course_mapping_id, time_slot_id, day_of_week, room, session_type }) {
  const entry = await ScheduleEntry.findByPk(id);
  if (!entry) {
    throw new NotFoundError('Schedule entry not found', { payload: { message: 'Schedule entry not found' } });
  }

  if (!day_of_week) {
    throw new ValidationError('Required day_of_week', { payload: { message: 'Required day_of_week' } });
  }
  if (!room) {
    throw new ValidationError('Required room', { payload: { message: 'Required room' } });
  }
  if (!session_type) {
    throw new ValidationError('Required session_type', { payload: { message: 'Required session_type' } });
  }

  const mappingId = course_mapping_id || entry.course_mapping_id;
  const slotId = time_slot_id || entry.time_slot_id;

  const courseMapping = await CourseMapping.findByPk(mappingId);
  if (!courseMapping) {
    throw new NotFoundError('Course mapping not found', { payload: { message: 'Course mapping not found' } });
  }

  if (courseMapping.availability) {
    const scheduleEntries = await availabilityToScheduleEntries(courseMapping.availability, TimeSlot);
    const isValid = scheduleEntries.some(
      (e) => e.day_of_week === day_of_week && e.time_slot_id === slotId
    );
    if (!isValid) {
      const requestedTimeSlot = await TimeSlot.findByPk(slotId);
      const timeSlotLabel = requestedTimeSlot ? requestedTimeSlot.label : slotId;
      throw new ValidationError('Availability mismatch', {
        payload: {
          message: `Invalid schedule: ${day_of_week} at ${timeSlotLabel} is not in the course availability.`,
          availability: courseMapping.availability,
          requested: { day: day_of_week, time_slot: timeSlotLabel },
          hint: 'The schedule must match one of the sessions defined in the course mapping availability.',
        },
      });
    }
  }

  const isDayOrTimeChanged =
    (time_slot_id && time_slot_id !== entry.time_slot_id) ||
    day_of_week !== entry.day_of_week;

  if (isDayOrTimeChanged) {
    const existingEntry = await ScheduleEntry.findOne({
      where: { schedule_id: entry.schedule_id, day_of_week, time_slot_id: slotId, id: { [Op.ne]: id } },
      include: [{ model: TimeSlot, attributes: ['label'] }],
    });
    if (existingEntry) {
      const timeSlotLabel = existingEntry.TimeSlot?.label || slotId;
      throw new ConflictError('Entry already exists', {
        payload: {
          message: `A schedule entry already exists for ${day_of_week} at ${timeSlotLabel} in this schedule.`,
          existing_entry_id: existingEntry.id,
        },
      });
    }
  }

  const checkingConflict =
    (course_mapping_id && course_mapping_id !== entry.course_mapping_id) ||
    (time_slot_id && time_slot_id !== entry.time_slot_id) ||
    day_of_week !== entry.day_of_week ||
    room !== entry.room;

  if (checkingConflict) {
    const conflictCheck = await checkScheduleConflict(mappingId, slotId, day_of_week, room, id);
    if (conflictCheck.hasError) {
      throw new ValidationError(conflictCheck.error.message, {
        payload: { message: conflictCheck.error.message },
        statusCode: conflictCheck.error.status,
      });
    }
    if (conflictCheck.hasConflict) {
      throw new ConflictError(conflictCheck.conflict.message, {
        payload: { message: conflictCheck.conflict.message, conflict: conflictCheck.conflict.details },
      });
    }
  }

  await entry.update({ course_mapping_id: mappingId, time_slot_id: slotId, day_of_week, room, session_type });
  return { schedule: entry, message: 'Schedule entry updated successfully' };
}

// ---------------------------------------------------------------------------
// Service: deleteScheduleEntryData
// ---------------------------------------------------------------------------

export async function deleteScheduleEntryData(id) {
  const entry = await ScheduleEntry.findByPk(id);
  if (!entry) {
    throw new NotFoundError('Schedule entry not found', { payload: { message: 'Schedule entry not found' } });
  }
  await entry.destroy();
  return { message: 'Schedule entry deleted successfully' };
}
