import { useState, useEffect } from 'react';
import { listUniversities as apiListUniversities, createUniversity as apiCreateUniversity } from '../services/university.service';

export const useUniversities = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      const data = await apiListUniversities();
      setUniversities(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching universities:', err);
      setError('Failed to fetch universities');
    } finally {
      setLoading(false);
    }
  };

  const createUniversity = async (name) => {
    try {
      const created = await apiCreateUniversity(name);
      setUniversities(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created;
    } catch (err) {
      console.error('Error creating university:', err);
      if (err.response?.status === 409) {
        throw new Error('University already exists');
      }
      throw new Error('Failed to create university');
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  return {
    universities,
    loading,
    error,
    refetch: fetchUniversities,
    createUniversity
  };
};
