import { useState, useEffect, useRef } from 'react';
import { listContracts } from '../../../services/contract.service';

/**
 * Custom hook for managing contract data fetching, pagination, and filtering
 */
export function useContractData() {
  const [contracts, setContracts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [listAcademicYear, setListAcademicYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  // Fetch contracts effect
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        const body = await listContracts({ 
          page, 
          limit, 
          q: search || undefined, 
          status: statusFilter || undefined, 
          academic_year: listAcademicYear || undefined 
        });
        const data = body?.data || [];
        const totalCount = body?.total || 0;
        setTotal(totalCount);
        setHasMore(page * limit < totalCount);
        setContracts(prev => (page === 1 ? data : [...prev, ...data]));
      } catch (e) {
        console.error('Failed to fetch contracts:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [page, limit, search, statusFilter, listAcademicYear]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
    setContracts([]);
    setHasMore(true);
  }, [search, statusFilter, listAcademicYear]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && !loading && hasMore) {
        setPage(p => p + 1);
      }
    }, { root: null, rootMargin: '0px', threshold: 1.0 });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, hasMore]);

  const refreshContracts = async () => {
    try {
      const refreshed = await listContracts({ 
        page: 1, 
        limit, 
        q: search || undefined, 
        status: statusFilter || undefined, 
        academic_year: listAcademicYear || undefined 
      });
      setContracts(refreshed?.data || []);
      setTotal(refreshed?.total || 0);
      setHasMore(limit < (refreshed?.total || 0));
      setPage(1);
    } catch (e) {
      console.error('Failed to refresh contracts:', e);
    }
  };

  return {
    contracts,
    setContracts,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    listAcademicYear,
    setListAcademicYear,
    loading,
    page,
    total,
    limit,
    hasMore,
    sentinelRef,
    refreshContracts,
  };
}
