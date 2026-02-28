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

// GET /api/schedule-entries - Get all time slots
export const getSchedule = async (req, res) => {
  try {
    const { class_name, dept_name, specialization, schedule_id } = req.query;

    let whereClause = {};
    if (schedule_id) {
      whereClause.schedule_id = schedule_id;
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

    return res.status(200).json({
      schedule,
      message: 'Schedule entries retrieved successfully',
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// POST /api/schedule-entries - Create a time slot
export const createSchedule = async (req, res) => {
  try {
    const { schedule_id, course_mapping_id, time_slot_id, day_of_week, room, session_type } =
      req.body;

    if (!schedule_id) return res.status(400).json({ message: 'Required schedule_id' });
    if (!room) return res.status(400).json({ message: 'Required room' });
    if (!session_type) return res.status(400).json({ message: 'Required session_type' });
    if (!course_mapping_id) return res.status(400).json({ message: 'Required course_mapping_id' });
    if (!day_of_week) return res.status(400).json({ message: 'Required day_of_week' });
    if (!time_slot_id) return res.status(400).json({ message: 'Required time_slot_id' });

    // Verify schedule exists
    const scheduleContainer = await Schedule.findByPk(schedule_id);
    if (!scheduleContainer) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

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

    // Check if entry already exists in this schedule with same day and time slot
    const existingEntry = await ScheduleEntry.findOne({
      where: {
        schedule_id,
        day_of_week,
        time_slot_id,
      },
      include: [
        {
          model: TimeSlot,
          attributes: ['label'],
        },
      ],
    });

    if (existingEntry) {
      const timeSlotLabel = existingEntry.TimeSlot?.label || time_slot_id;
      return res.status(409).json({
        message: `A schedule entry already exists for ${day_of_week} at ${timeSlotLabel} in this schedule.`,
        existing_entry_id: existingEntry.id,
      });
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

    // Create the schedule entry
    const schedule = await ScheduleEntry.create({
      schedule_id,
      course_mapping_id,
      time_slot_id,
      day_of_week,
      room,
      session_type,
    });

    return res.status(201).json({ schedule, message: 'Schedule entry created successfully' });
  } catch (err) {
    console.log('[CreateSchedule]', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// POST /api/schedule-entries/bulk - Create multiple schedule entries at once
export const createBulkSchedule = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { schedule_id, entries } = req.body;

    // Validate request structure
    if (!schedule_id) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Required schedule_id' });
    }

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Required entries array with at least one entry' });
    }

    // Verify schedule exists
    const scheduleContainer = await Schedule.findByPk(schedule_id);
    if (!scheduleContainer) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Validate all entries first
    const validationErrors = [];
    const entriesData = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const errors = [];

      // Check required fields
      if (!entry.course_mapping_id) errors.push('course_mapping_id is required');
      if (!entry.day_of_week) errors.push('day_of_week is required');
      if (!entry.time_slot_id) errors.push('time_slot_id is required');
      if (!entry.room) errors.push('room is required');
      if (!entry.session_type) errors.push('session_type is required');

      if (errors.length > 0) {
        validationErrors.push({ index: i, entry, errors });
        continue;
      }

      entriesData.push({
        index: i,
        ...entry,
      });
    }

    if (validationErrors.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Validation failed for some entries',
        errors: validationErrors,
      });
    }

    // Check for duplicates within the request
    const duplicatesInRequest = [];
    for (let i = 0; i < entriesData.length; i++) {
      for (let j = i + 1; j < entriesData.length; j++) {
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
      return res.status(400).json({
        message: 'Duplicate entries found within the request (same day and time slot)',
        duplicates: duplicatesInRequest,
      });
    }

    // Check for existing entries in database
    const existingEntries = await ScheduleEntry.findAll({
      where: { schedule_id },
      attributes: ['day_of_week', 'time_slot_id', 'id'],
      include: [
        {
          model: TimeSlot,
          attributes: ['label'],
        },
      ],
      transaction,
    });

    const existingMap = new Map();
    existingEntries.forEach((existing) => {
      const key = `${existing.day_of_week}-${existing.time_slot_id}`;
      existingMap.set(key, {
        id: existing.id,
        label: existing.TimeSlot?.label || existing.time_slot_id,
      });
    });

    const conflicts = [];
    for (let i = 0; i < entriesData.length; i++) {
      const entry = entriesData[i];
      const key = `${entry.day_of_week}-${entry.time_slot_id}`;
      if (existingMap.has(key)) {
        const existing = existingMap.get(key);
        conflicts.push({
          index: i,
          day_of_week: entry.day_of_week,
          time_slot: existing.label,
          existing_entry_id: existing.id,
        });
      }
    }

    if (conflicts.length > 0) {
      await transaction.rollback();
      return res.status(409).json({
        message: 'Some entries conflict with existing schedule entries',
        conflicts,
      });
    }

    // Validate course mappings and availability
    const courseMappingIds = [...new Set(entriesData.map((e) => e.course_mapping_id))];
    const courseMappings = await CourseMapping.findAll({
      where: { id: courseMappingIds },
      transaction,
    });

    const courseMappingMap = new Map(courseMappings.map((cm) => [cm.id, cm]));

    const availabilityErrors = [];
    for (let i = 0; i < entriesData.length; i++) {
      const entry = entriesData[i];
      const courseMapping = courseMappingMap.get(entry.course_mapping_id);

      if (!courseMapping) {
        availabilityErrors.push({
          index: i,
          error: `Course mapping ${entry.course_mapping_id} not found`,
        });
        continue;
      }

      // Validate against availability if set
      if (courseMapping.availability) {
        const scheduleEntries = await availabilityToScheduleEntries(
          courseMapping.availability,
          TimeSlot
        );
        const isValidSchedule = scheduleEntries.some(
          (se) => se.day_of_week === entry.day_of_week && se.time_slot_id === entry.time_slot_id
        );

        if (!isValidSchedule) {
          const requestedTimeSlot = await TimeSlot.findByPk(entry.time_slot_id, { transaction });
          const timeSlotLabel = requestedTimeSlot ? requestedTimeSlot.label : entry.time_slot_id;

          availabilityErrors.push({
            index: i,
            error: `${entry.day_of_week} at ${timeSlotLabel} is not in the course availability`,
            availability: courseMapping.availability,
          });
        }
      }
    }

    if (availabilityErrors.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Some entries violate course availability constraints',
        errors: availabilityErrors,
      });
    }

    // Check for lecturer/room conflicts
    const conflictErrors = [];
    for (let i = 0; i < entriesData.length; i++) {
      const entry = entriesData[i];
      const conflictCheck = await checkScheduleConflict(
        entry.course_mapping_id,
        entry.time_slot_id,
        entry.day_of_week,
        entry.room
      );

      if (conflictCheck.hasError) {
        conflictErrors.push({
          index: i,
          error: conflictCheck.error.message,
        });
      } else if (conflictCheck.hasConflict) {
        conflictErrors.push({
          index: i,
          error: conflictCheck.conflict.message,
          conflict: conflictCheck.conflict.details,
        });
      }
    }

    if (conflictErrors.length > 0) {
      await transaction.rollback();
      return res.status(409).json({
        message: 'Some entries have lecturer or room conflicts',
        errors: conflictErrors,
      });
    }

    // All validations passed - create all entries
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

    return res.status(201).json({
      message: `Successfully created ${createdEntries.length} schedule entries`,
      count: createdEntries.length,
      entries: createdEntries,
    });
  } catch (err) {
    await transaction.rollback();
    console.log('[CreateBulkSchedule]', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// PUT /api/schedule-entries/:id - Update a time slot
export const editSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await ScheduleEntry.findByPk(id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule entry not found' });
    }

    const { course_mapping_id, time_slot_id, day_of_week, room, session_type } = req.body;

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

    // Check if entry already exists in this schedule with same day and time slot (excluding current entry)
    const isDayOrTimeChanged =
      (time_slot_id && time_slot_id !== schedule.time_slot_id) ||
      day_of_week !== schedule.day_of_week;

    if (isDayOrTimeChanged) {
      const existingEntry = await ScheduleEntry.findOne({
        where: {
          schedule_id: schedule.schedule_id,
          day_of_week,
          time_slot_id: slotId,
          id: { [require('sequelize').Op.ne]: id },
        },
        include: [
          {
            model: TimeSlot,
            attributes: ['label'],
          },
        ],
      });

      if (existingEntry) {
        const timeSlotLabel = existingEntry.TimeSlot?.label || slotId;
        return res.status(409).json({
          message: `A schedule entry already exists for ${day_of_week} at ${timeSlotLabel} in this schedule.`,
          existing_entry_id: existingEntry.id,
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
      const conflictCheck = await checkScheduleConflict(mappingId, slotId, day_of_week, room, id);

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
      day_of_week,
      room,
      session_type,
    });

    return res.status(200).json({ schedule, message: 'Schedule entry updated successfully' });
  } catch (err) {
    console.log('[EditSchedule]', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// DELETE /api/schedule-entries/:id - Delete a time slot
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await ScheduleEntry.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule entry not found' });
    }

    await schedule.destroy();

    return res.status(200).json({
      message: 'Schedule entry deleted successfully',
    });
  } catch (err) {
    console.log('[DeleteSchedule]', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};
