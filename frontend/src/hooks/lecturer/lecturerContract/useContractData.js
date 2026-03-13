import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { listContracts } from '../../../services/contract.service';
import { listAdvisorContracts } from '../../../services/advisorContract.service';
import { getMyLecturerProfile } from '../../../services/lecturerProfile.service';
import { getDisplayStatus } from '../../../utils/lecturerContractHelpers';

/**
 * Custom hook for managing contract data
 * Handles fetching contracts and lecturer profile
 */
export const useContractData = () => {
  const { authUser } = useAuthStore();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hourlyRate, setHourlyRate] = useState(null);
  const [lecturerProfile, setLecturerProfile] = useState(null);

  // Fetch contracts
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const role = String(authUser?.role || '').toLowerCase();

      let teaching = [];
      let advisor = [];

      // Advisors should only see advisor contracts (teaching contracts are lecturer-only).
      if (role !== 'advisor') {
        const teachingRes = await listContracts({ page, limit, q: q || undefined });
        teaching = (teachingRes?.data || []).map((c) => ({ ...c, contract_type: 'TEACHING' }));
      }

      // Advisor contracts endpoint supports lecturer/advisor scope; keep it unfiltered.
      const advisorRes = await listAdvisorContracts({ page: 1, limit: 1000 });
      advisor = (advisorRes?.data || []).map((c) => ({ ...c, contract_type: 'ADVISOR' }));

      const merged = [...teaching, ...advisor];

      setContracts(merged);
      setTotal(merged.length);
    } catch (e) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  // Fetch lecturer profile for hourly rate
  useEffect(() => {
    let mounted = true;
    
    (async () => {
      try {
        const res = await getMyLecturerProfile();
        const raw = res?.hourlyRateThisYear;
        const parsed = raw != null 
          ? parseFloat(String(raw).replace(/[^0-9.]/g, '')) 
          : null;
        
        if (mounted) {
          setHourlyRate(Number.isFinite(parsed) ? parsed : null);
          setLecturerProfile(res || null);
        }
      } catch {
        if (mounted) setHourlyRate(null);
      }
    })();
    
    return () => { mounted = false; };
  }, []);

  // Fetch contracts when dependencies change
  useEffect(() => {
    fetchContracts();
  }, [page, limit, q, authUser?.role]);

  // Pending contracts (requiring lecturer signature)
  const pendingContracts = useMemo(() => 
    (contracts || []).filter(c => {
      const t = String(c?.contract_type || '').toUpperCase();
      if (t === 'ADVISOR') {
        return String(c?.status || '').toUpperCase() === 'DRAFT' && !c?.advisor_signed_at;
      }
      return (
        c.status === 'WAITING_LECTURER' ||
        c.status === 'MANAGEMENT_SIGNED' ||
        c.status === 'DRAFT'
      );
    }),
    [contracts]
  );

  // Filtered contracts based on status
  const filteredContracts = useMemo(() => {
    const list = contracts || [];
    if (statusFilter === 'ALL') return list;
    
    return list.filter(c => {
      const ds = getDisplayStatus(c);
      return (
        (statusFilter === 'WAITING_ADVISOR' && ds === 'WAITING_ADVISOR') ||
        (statusFilter === 'WAITING_LECTURER' && ds === 'WAITING_LECTURER') ||
        (statusFilter === 'WAITING_MANAGEMENT' && ds === 'WAITING_MANAGEMENT') ||
        (statusFilter === 'COMPLETED' && ds === 'COMPLETED') ||
        (statusFilter === 'CONTRACT_ENDED' && ds === 'CONTRACT_ENDED')
      );
    });
  }, [contracts, statusFilter]);

  return {
    contracts,
    setContracts,
    loading,
    page,
    setPage,
    limit,
    total,
    q,
    setQ,
    statusFilter,
    setStatusFilter,
    hourlyRate,
    lecturerProfile,
    pendingContracts,
    filteredContracts,
    fetchContracts,
  };
};
