import { useCallback, useEffect, useMemo, useState } from 'react';
import { getScheduleEntries } from '../../../services/schedule.service';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const DEFAULT_SPECIAL_SLOTS = {
  '07h:45-08h:00': 'National Anthem',
  '09h:30-09h:50': 'Break (20mns)',
  '11h:30-12h:10': 'Lunch Break (40mns)',
  '13h:40-13h:50': 'Break (10mns)',
  '15h:20-15h:30': 'Break (10mns)',
};

const DEFAULT_TIME_SLOTS = [
  '07h:45-08h:00',
  '08h:00-09h:30',
  '09h:30-09h:50',
  '09h:50-11h:30',
  '11h:30-12h:10',
  '12h:10-13h:40',
  '13h:40-13h:50',
  '13h:50-15h:20',
  '15h:20-15h:30',
  '15h:30-17h:00',
];

const DAY_ALIASES = {
  mon: 'Monday',
  monday: 'Monday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  tuesday: 'Tuesday',
  wed: 'Wednesday',
  wednesday: 'Wednesday',
  thu: 'Thursday',
  thur: 'Thursday',
  thurs: 'Thursday',
  thursday: 'Thursday',
  fri: 'Friday',
  friday: 'Friday',
};

const normalizeDay = (value) => {
  const key = String(value || '').trim().toLowerCase();
  return DAY_ALIASES[key] || null;
};

export const useLecturerSchedule = (scheduleId) => {
  const [entries, setEntries] = useState([]);
  const [specialSlots, setSpecialSlots] = useState(DEFAULT_SPECIAL_SLOTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSchedule = useCallback(async () => {
    // If no scheduleId is provided, avoid an unscoped fetch and reset to defaults.
    if (!scheduleId) {
      setEntries([]);
      setSpecialSlots(DEFAULT_SPECIAL_SLOTS);
      setError('');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const params = { schedule_id: scheduleId };
      const response = await getScheduleEntries(params);
      setEntries(Array.isArray(response?.data?.schedule) ? response.data.schedule : []);
      setSpecialSlots(
        response?.data?.specialSlots && typeof response.data.specialSlots === 'object'
          ? response.data.specialSlots
          : DEFAULT_SPECIAL_SLOTS
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load schedule');
      setEntries([]);
      setSpecialSlots(DEFAULT_SPECIAL_SLOTS);
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const viewModel = useMemo(() => {
    const timeSlotMap = new Map();
    const grid = {};

    for (const day of DAYS) {
      grid[day] = {};
    }

    for (const entry of entries) {
      const normalizedDay = normalizeDay(entry?.day_of_week);
      const timeLabel = entry?.TimeSlot?.label;
      if (!normalizedDay || !timeLabel) continue;

      const orderIndex = Number.isFinite(Number(entry?.TimeSlot?.order_index))
        ? Number(entry.TimeSlot.order_index)
        : Number.MAX_SAFE_INTEGER;

      if (!timeSlotMap.has(timeLabel)) {
        timeSlotMap.set(timeLabel, orderIndex);
      }

      const cellEntries = grid[normalizedDay][timeLabel] || [];
      cellEntries.push({
        id: entry?.id,
        course: entry?.CourseMapping?.Course?.course_name || '-',
        lecturer: [
          entry?.CourseMapping?.LecturerProfile?.title,
          entry?.CourseMapping?.LecturerProfile?.full_name_english,
        ]
          .filter(Boolean)
          .join(' ')
          .trim() || '-',
        room: entry?.room || '-',
        sessionType: entry?.session_type || '-',
        group: entry?.CourseMapping?.Group?.name || '-',
      });

      grid[normalizedDay][timeLabel] = cellEntries;
    }

    const fetchedTimeSlots = [...timeSlotMap.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([label]) => label);

    const timeSlots = fetchedTimeSlots.length > 0 ? fetchedTimeSlots : DEFAULT_TIME_SLOTS;

    const firstWithGroup = entries.find((entry) => entry?.CourseMapping?.Group?.name);
    const groupName = firstWithGroup?.CourseMapping?.Group?.name || '-';

    return {
      days: DAYS,
      timeSlots,
      grid,
      specialSlots,
      groupName,
      generatedCount: entries.length,
    };
  }, [entries, specialSlots]);

  return {
    loading,
    error,
    refetch: fetchSchedule,
    ...viewModel,
  };
};

export default useLecturerSchedule;
