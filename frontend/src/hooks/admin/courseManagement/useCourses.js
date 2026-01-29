import { useState, useEffect, useRef, useCallback } from 'react';
import { getCourses as apiGetCourses } from '../../../services/course.service.js';
import toast from 'react-hot-toast';

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);
  const hasLoadedInitial = useRef(false);

  const load = useCallback(async (reset = false, sortBy = '', hoursFilter = '') => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (reset) {
      setPage(1);
      setHasMore(true);
      setCourses([]);
    }
    setLoading(true);
    
    try {
      const targetPage = reset ? 1 : page;
      const query = { page: targetPage, limit };
      if (sortBy) query.sortBy = sortBy;
      if (hoursFilter) query.hours = hoursFilter;

      const res = await apiGetCourses(query);
      const payload = res.data;
      
      if (Array.isArray(payload)) {
        setCourses(payload);
        setHasMore(false);
      } else if (payload && Array.isArray(payload.data)) {
        setCourses(prev => reset ? payload.data : [...prev, ...payload.data]);
        setHasMore(!!payload.hasMore);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [page, limit]);

  // Initial load on mount
  useEffect(() => {
    if (!hasLoadedInitial.current) {
      hasLoadedInitial.current = true;
      load(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      load(false);
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    
    const observer = new IntersectionObserver(entries => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loading) {
        setPage(p => p + 1);
      }
    }, { threshold: 1 });
    
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return {
    courses,
    setCourses,
    loading,
    page,
    setPage,
    hasMore,
    sentinelRef,
    load
  };
}
