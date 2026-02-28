// Helper function to check for schedule conflicts

import CourseMapping from '../model/courseMapping.model.js';
import Group from '../model/group.model.js';
import ScheduleEntry from '../model/scheduleEntry.model.js';
import Schedule from '../model/schedule.model.js';
import LecturerProfile from '../model/lecturerProfile.model.js';
import Course from '../model/course.model.js';
import { Op } from 'sequelize';

/**
 * Check for schedule conflicts
 * - Lecturer conflicts: Same lecturer teaching different courses at the same time
 * - Room conflicts: Same room used for different courses at the same time
 * - Exception: Combined sessions (same course, same lecturer, different groups) are allowed
 */
export const checkScheduleConflict = async (
  course_mapping_id,
  time_slot_id,
  day_of_week,
  room,
  excludeScheduleEntryId = null
) => {
  const courseMapping = await CourseMapping.findByPk(course_mapping_id, {
    include: [
      { model: Group, attributes: ['id', 'name'] },
      { model: LecturerProfile, attributes: ['id', 'full_name_english'] },
      { model: Course, attributes: ['id', 'course_name', 'course_code'] },
    ],
  });

  if (!courseMapping) {
    return { hasError: true, error: { status: 404, message: 'Course mapping not found' } };
  }

  // Build where clause for finding potential conflicts
  const whereClause = {
    day_of_week,
    time_slot_id,
  };

  // Exclude a specific schedule entry (useful for updates)
  if (excludeScheduleEntryId) {
    whereClause.id = { [Op.ne]: excludeScheduleEntryId };
  }

  // Find all entries at the same day and time
  const potentialConflicts = await ScheduleEntry.findAll({
    where: whereClause,
    include: [
      {
        model: CourseMapping,
        attributes: ['id', 'course_id', 'lecturer_profile_id', 'group_id'],
        required: true,
        include: [
          { model: Group, attributes: ['id', 'name'] },
          { model: LecturerProfile, attributes: ['id', 'full_name_english'] },
          { model: Course, attributes: ['id', 'course_name', 'course_code'] },
        ],
      },
      {
        model: Schedule,
        attributes: ['id', 'group_id', 'name'],
        required: true,
        include: [{ model: Group, attributes: ['id', 'name'] }],
      },
    ],
  });

  // Check each potential conflict
  for (const conflict of potentialConflicts) {
    if (!conflict.CourseMapping || !conflict.Schedule) continue;

    const sameCourse = conflict.CourseMapping.course_id === courseMapping.course_id;
    const sameLecturer =
      conflict.CourseMapping.lecturer_profile_id === courseMapping.lecturer_profile_id;
    const sameRoom = conflict.room === room;

    // Check if this is a combined session (same course, same lecturer, same room, different groups)
    // Use the Schedule's group_id to determine if it's a different group
    const differentScheduleGroup = conflict.Schedule.group_id !== courseMapping.group_id;

    if (sameCourse && sameLecturer && sameRoom && differentScheduleGroup) {
      // This is a combined session - allowed
      continue;
    }

    // Check for lecturer conflict (same lecturer, same time, different course)
    if (sameLecturer && !sameCourse) {
      return {
        hasConflict: true,
        conflict: {
          status: 409,
          message: `Lecturer conflict: ${conflict.CourseMapping.LecturerProfile?.full_name_english} is already teaching ${conflict.CourseMapping.Course?.course_name} at this time`,
          details: {
            type: 'lecturer',
            day: conflict.day_of_week,
            time_slot_id: conflict.time_slot_id,
            lecturer: conflict.CourseMapping.LecturerProfile?.full_name_english,
            conflicting_course: conflict.CourseMapping.Course?.course_name,
            conflicting_schedule: conflict.Schedule.name,
          },
        },
      };
    }

    // Check for room conflict (same room, same time, different course or different lecturer)
    if (sameRoom && (!sameCourse || !sameLecturer)) {
      return {
        hasConflict: true,
        conflict: {
          status: 409,
          message: `Room conflict: Room ${room} is already occupied by ${conflict.CourseMapping.Course?.course_name} at this time`,
          details: {
            type: 'room',
            day: conflict.day_of_week,
            time_slot_id: conflict.time_slot_id,
            room: conflict.room,
            conflicting_course: conflict.CourseMapping.Course?.course_name,
            conflicting_lecturer: conflict.CourseMapping.LecturerProfile?.full_name_english,
            conflicting_schedule: conflict.Schedule.name,
          },
        },
      };
    }
  }

  return { hasConflict: false };
};
