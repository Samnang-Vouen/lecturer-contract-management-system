import { useCallback, useEffect, useState } from 'react';
import { getSchedules } from '../../../services/schedule.service';

export const useLecturerSchedulesList = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getSchedules();
      setSchedules(Array.isArray(response?.data?.schedules) ? response.data.schedules : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load schedules');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules,
  };
};

export default useLecturerSchedulesList;
