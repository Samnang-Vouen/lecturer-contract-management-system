import { useCallback, useMemo, useState } from 'react';
import {
  getCandidateInterviewDetails as apiGetCandidateInterviewDetails,
  saveCandidateQuestion as apiSaveCandidateQuestion,
} from '../../../services/interview.service';

export function useCandidateResponses() {
  // Structure: { [candidateId]: { [questionId]: { rating?: number, noted?: string } } }
  const [byCandidate, setByCandidate] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCandidateInterviewDetails = useCallback(async (candidateId) => {
    setLoading(true);
    try {
      const data = await apiGetCandidateInterviewDetails(candidateId);
      const map = {};
      const responses = Array.isArray(data?.responses) ? data.responses : [];
      for (const r of responses) {
        map[r.question_id ?? r.id] = {
          rating: r.rating ?? 0,
          noted: r.noted ?? '',
        };
      }
      setByCandidate((prev) => ({ ...prev, [candidateId]: map }));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load interview details');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateResponse = useCallback((candidateId, questionId, partial) => {
    setByCandidate((prev) => ({
      ...prev,
      [candidateId]: {
        ...(prev[candidateId] || {}),
        [questionId]: { ...(prev[candidateId]?.[questionId] || {}), ...partial },
      },
    }));
  }, []);

  const saveResponse = useCallback(async (candidateId, questionId, data) => {
    await apiSaveCandidateQuestion(candidateId, questionId, data);
  }, []);

  const calculateAverageScore = useCallback((candidateId) => {
    const resp = byCandidate[candidateId] || {};
    const ratings = Object.values(resp)
      .map((r) => r.rating)
      .filter((v) => typeof v === 'number' && v > 0);
    if (!ratings.length) return 0;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  }, [byCandidate]);

  const candidateResponses = useCallback((candidateId) => byCandidate[candidateId] || {}, [byCandidate]);

  return {
    candidateResponses,
    loading,
    error,
    fetchCandidateInterviewDetails,
    saveResponse,
    updateResponse,
    calculateAverageScore,
    setError,
  };
}
