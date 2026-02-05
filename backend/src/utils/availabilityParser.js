/**
 * Utility functions to parse availability from course mappings
 * and convert session numbers to time slots
 */

/**
 * Session to time slot mapping
 * Each session is 1 hour and 30 minutes
 * S1 = 08h:00-09h:30
 * S2 = 09h:50-11h:30 (after 20min break)
 * S3 = 12h:10-13h:40 (after lunch)
 * S4 = 13h:50-15h:20 (after 10min break)
 * S5 = 15h:30-17h:00 (after 10min break)
 */
const SESSION_TO_TIMESLOT = {
  S1: '08h:00-09h:30',
  S2: '09h:50-11h:30',
  S3: '12h:10-13h:40',
  S4: '13h:50-15h:20',
  S5: '15h:30-17h:00',
};

/**
 * Parse availability string from course mapping
 * Format: "Monday: S1, S2; Wednesday: S3, S4, S5; Friday: S4, S5"
 *
 * @param {string} availabilityString - The availability string from course mapping
 * @returns {Array} Array of {day, session, timeSlot} objects
 *
 * Example output:
 * [
 *   { day: 'Monday', session: 'S1', timeSlot: '08h:00-09h:30' },
 *   { day: 'Monday', session: 'S2', timeSlot: '09h:50-11h:30' },
 *   { day: 'Wednesday', session: 'S3', timeSlot: '12h:10-13h:40' },
 *   ...
 * ]
 */
export function parseAvailability(availabilityString) {
  if (!availabilityString || typeof availabilityString !== 'string') {
    return [];
  }

  const result = [];

  // Split by semicolon to get each day's availability
  const dayBlocks = availabilityString.split(';').map((block) => block.trim());

  for (const block of dayBlocks) {
    if (!block) continue;

    // Split by colon to separate day and sessions
    const [dayPart, sessionsPart] = block.split(':').map((part) => part.trim());

    if (!dayPart || !sessionsPart) continue;

    // Normalize day name (capitalize first letter)
    const day = dayPart.charAt(0).toUpperCase() + dayPart.slice(1).toLowerCase();

    // Validate day
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    if (!validDays.includes(day)) {
      console.warn(`Invalid day: ${day}`);
      continue;
    }

    // Split sessions by comma
    const sessions = sessionsPart.split(',').map((s) => s.trim().toUpperCase());

    for (const session of sessions) {
      if (!session) continue;

      // Validate session
      if (!SESSION_TO_TIMESLOT[session]) {
        console.warn(`Invalid session: ${session}`);
        continue;
      }

      result.push({
        day,
        session,
        timeSlot: SESSION_TO_TIMESLOT[session],
      });
    }
  }

  return result;
}

/**
 * Get time slot ID from time slot label
 * This requires querying the database
 *
 * @param {string} timeSlotLabel - The time slot label (e.g., '08h:00-09h:30')
 * @param {Object} TimeSlotModel - The Sequelize TimeSlot model
 * @returns {Promise<number|null>} The time slot ID or null if not found
 */
export async function getTimeSlotId(timeSlotLabel, TimeSlotModel) {
  try {
    const timeSlot = await TimeSlotModel.findOne({
      where: { label: timeSlotLabel },
    });
    return timeSlot ? timeSlot.id : null;
  } catch (error) {
    console.error(`Error fetching time slot ID for ${timeSlotLabel}:`, error);
    return null;
  }
}

/**
 * Convert availability string to schedule entries
 *
 * @param {string} availabilityString - The availability string from course mapping
 * @param {Object} TimeSlotModel - The Sequelize TimeSlot model
 * @returns {Promise<Array>} Array of schedule entry objects ready to be inserted
 *
 * Example output:
 * [
 *   { day_of_week: 'Monday', time_slot_id: 1 },
 *   { day_of_week: 'Monday', time_slot_id: 2 },
 *   ...
 * ]
 */
export async function availabilityToScheduleEntries(availabilityString, TimeSlotModel) {
  const parsedAvailability = parseAvailability(availabilityString);
  const scheduleEntries = [];

  const allTimeSlots = await TimeSlotModel.findAll();
  const timeSlotMap = new Map(allTimeSlots.map((ts) => [ts.label, ts.id]));

  for (const { day, timeSlot } of parsedAvailability) {
    const timeSlotId = timeSlotMap.get(timeSlot);

    if (timeSlotId) {
      scheduleEntries.push({
        day_of_week: day,
        time_slot_id: timeSlotId,
      });
    } else {
      console.warn(`Time slot not found in database: ${timeSlot}`);
    }
  }

  return scheduleEntries;
}

/**
 * Format schedule entries for display
 *
 * @param {Array} scheduleEntries - Array of schedule entries
 * @returns {string} Formatted string for display
 */
export function formatScheduleEntries(scheduleEntries) {
  const grouped = {};

  for (const entry of scheduleEntries) {
    const day = entry.day_of_week;
    if (!grouped[day]) {
      grouped[day] = [];
    }
    grouped[day].push(entry);
  }

  const parts = [];
  for (const [day, entries] of Object.entries(grouped)) {
    const sessions = entries.map((e) => {
      const timeSlot = e.TimeSlot?.label || e.time_slot_id;
      return timeSlot;
    });
    parts.push(`${day}: ${sessions.join(', ')}`);
  }

  return parts.join('; ');
}
