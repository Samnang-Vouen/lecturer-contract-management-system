// Helper function to check for schedule conflicts

import CourseMapping from '../model/courseMapping.model.js';
import Group from '../model/group.model.js';
import Schedule from '../model/schedule.model.js';

// Allows combined sessions (same course, lecturer, room, time but different groups)
export const checkScheduleConflict = async (
  course_mapping_id,
  time_slot_id,
  day_of_week,
  room,
  excludeScheduleId = null
) => {
  const courseMapping = await CourseMapping.findByPk(course_mapping_id, {
    include: [{ model: Group, attributes: ['id', 'name'] }],
  });

  if (!courseMapping) {
    return { hasError: true, error: { status: 404, message: 'Course mapping not found' } };
  }

  // Build where clause for finding conflicts
  const { Op } = await import('sequelize');
  const whereClause = {
    day_of_week,
    time_slot_id,
    room,
  };

  // Exclude a specific schedule (useful for updates)
  if (excludeScheduleId) {
    whereClause.id = { [Op.ne]: excludeScheduleId };
  }

  // Find potential conflicts
  const conflicts = await Schedule.findAll({
    where: whereClause,
    include: [
      {
        model: CourseMapping,
        attributes: ['id', 'course_id', 'lecturer_profile_id', 'group_id'],
        include: [{ model: Group, attributes: ['id', 'name'] }],
      },
    ],
  });

  // Check each conflict
  for (const conflict of conflicts) {
    if (!conflict.CourseMapping) continue;

    const sameCourse = conflict.CourseMapping.course_id === courseMapping.course_id;
    const sameLecturer =
      conflict.CourseMapping.lecturer_profile_id === courseMapping.lecturer_profile_id;
    const differentGroup = conflict.CourseMapping.group_id !== courseMapping.group_id;

    // Allow combined sessions: same course, same lecturer, different groups
    if (sameCourse && sameLecturer && differentGroup) {
      continue;
    }

    return {
      hasConflict: true,
      conflict: {
        status: 409,
        message: 'Schedule conflict detected',
        details: {
          day: conflict.day_of_week,
          time_slot_id: conflict.time_slot_id,
          room: conflict.room,
        },
      },
    };
  }

  return { hasConflict: false };
};
