import { useState, useEffect, useMemo } from 'react';
import { listContracts } from '../../services/contract.service';

/**
 * Custom hook to manage contract fetching and filtering
 */
export const useContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await listContracts({ 
        page, 
        limit, 
        q: q || undefined, 
        status: status || undefined 
      });
      setContracts(res?.data || []);
      setTotal(res?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [page, limit, q, status]);

  // Client-side search: dynamic, case-insensitive, starts-with on lecturer name only (ignore titles)
  const filteredContracts = useMemo(() => {
    const normalize = (s) => (s || '').toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
    const stripTitle = (s) => {
      const titles = '(mr|mrs|ms|miss|dr|prof|professor)';
      return s.replace(new RegExp(`^${titles}\\s+`, 'i'), '').trim();
    };
    const qRaw = normalize(q);
    const qName = stripTitle(qRaw);
    
    // Start with server results and apply status filter again client-side for robustness
    const base = (contracts || []).filter(c => {
      if (!status) return true;
      return c.status === status;
    });
    
    if (!qName) return base;
    
    return base.filter(c => {
      const lecturerTitle = normalize(c.lecturer?.LecturerProfile?.title || c.lecturer?.title || '');
      const lecturerNameBase = normalize(
        c.lecturer?.display_name || 
        c.lecturer?.full_name || 
        c.lecturer?.full_name_english || 
        c.lecturer?.full_name_khmer || 
        c.lecturer?.email || ''
      );
      const fullName = `${lecturerTitle ? lecturerTitle + ' ' : ''}${lecturerNameBase}`.trim();
      const candidate = stripTitle(fullName);
      
      if (!candidate) return false;
      if (candidate.startsWith(qName)) return true;
      
      const tokens = candidate.split(' ').filter(Boolean);
      return tokens.some(t => t.startsWith(qName));
    });
  }, [contracts, q, status]);

  return {
    contracts,
    filteredContracts,
    loading,
    page,
    setPage,
    limit,
    total,
    q,
    setQ,
    status,
    setStatus,
    fetchContracts
  };
};
