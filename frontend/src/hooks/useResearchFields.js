import { useState, useEffect } from 'react';
import { listResearchFields as apiListResearchFields, createResearchField as apiCreateResearchField } from '../services/researchField.service';

export const useResearchFields = () => {
  const [researchFields, setResearchFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResearchFields = async () => {
    try {
      setLoading(true);
      const data = await apiListResearchFields();
      setResearchFields(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching research fields:', err);
      setError('Failed to fetch research fields');
      setResearchFields([]);
    } finally {
      setLoading(false);
    }
  };

  const createResearchField = async (name) => {
    try {
      const newField = await apiCreateResearchField(name);
      setResearchFields(prev => [...prev, newField].sort((a, b) => a.name.localeCompare(b.name)));
      return newField;
    } catch (err) {
      console.error('Error creating research field:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchResearchFields();
  }, []);

  return {
    researchFields,
    loading,
    error,
    refetch: fetchResearchFields,
    createResearchField
  };
};
