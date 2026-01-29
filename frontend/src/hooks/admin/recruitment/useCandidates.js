import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  listCandidates as apiListCandidates,
  createCandidate as apiCreateCandidate,
  updateCandidate as apiUpdateCandidate,
  deleteCandidate as apiDeleteCandidate,
} from '../../../services/candidate.service';

export function useCandidates(initialParams = { limit: 10 }) {
  const limit = initialParams.limit ?? 10;
  const [candidates, setCandidates] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const paramsRef = useRef({ status: 'all' });

  const fetchPage = useCallback(async (nextPage = 1) => {
    if (loading) return;
    setLoading(true);
    try {
      const query = { page: nextPage, limit };
      if (paramsRef.current.status && paramsRef.current.status !== 'all') {
        query.status = paramsRef.current.status;
      }
      const payload = await apiListCandidates(query);
      setCandidates((prev) =>
        nextPage === 1
          ? payload.data
          : [...prev, ...payload.data.filter((n) => !prev.some((p) => p.id === n.id))]
      );
      setPage(payload.page);
      setHasMore(!!payload.hasMore);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }, [limit, loading]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) fetchPage(page + 1);
  }, [fetchPage, hasMore, loading, page]);

  const refresh = useCallback(() => {
    setCandidates([]);
    setHasMore(true);
    fetchPage(1);
  }, [fetchPage]);

  const setFilterStatus = useCallback((status) => {
    paramsRef.current.status = status;
    setCandidates([]);
    setHasMore(true);
    fetchPage(1);
  }, [fetchPage]);

  const createCandidate = useCallback(async (payload) => {
    const data = await apiCreateCandidate(payload);
    setCandidates((prev) => [data, ...prev]);
    return data;
  }, []);

  const updateCandidate = useCallback(async (id, payload) => {
    const data = await apiUpdateCandidate(id, payload);
    setCandidates((prev) => prev.map((c) => (c.id === data.id ? data : c)));
    return data;
  }, []);

  const deleteCandidate = useCallback(async (id) => {
    await apiDeleteCandidate(id);
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  }, []);

  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    candidates,
    loading,
    error,
    pagination: { page, hasMore, limit },
    createCandidate,
    updateCandidate,
    deleteCandidate,
    loadMore,
    refresh,
    setError,
    setFilterStatus,
  };
}
