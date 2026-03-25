import { useState, useEffect, useMemo } from 'react';
import { listContracts } from '../../services/contract.service';
import { listAdvisorContracts } from '../../services/advisorContract.service';
import { parseDateOnlyToLocalDate } from '../../utils/lecturerContractHelpers';

function normalizeStatusValue(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

function getManagementDisplayStatus(contract) {
  const status = normalizeStatusValue(contract?.status);
  const requesterRole = normalizeStatusValue(contract?.latest_redo_requester_role);

  if (status === 'REQUEST_REDO' && requesterRole === 'MANAGEMENT') {
    return 'WAITING_RESPONSE';
  }

  return status;
}

function mapServerStatusFilter(status) {
  const normalized = normalizeStatusValue(status);

  if (normalized === 'WAITING_RESPONSE' || normalized === 'REQUEST_REDO') {
    return 'REQUEST_REDO';
  }

  return normalized || undefined;
}

function mapAdvisorStatusFilter(status) {
  const normalized = mapServerStatusFilter(status);

  if (normalized === 'WAITING_ADVISOR') return 'DRAFT';
  if (normalized === 'WAITING_LECTURER') return '__NO_MATCH__';
  return normalized || undefined;
}

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

  const normalizeAdvisorContract = (c) => {
    const raw = c || {};
    const statusRaw = String(raw.status || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
    const hasAdvisorSig = !!raw?.advisor_signed_at;
    const hasManagementSig = !!raw?.management_signed_at;

    const end = raw?.end_date || raw?.endDate;
    const isEndedByDate = (() => {
      if (!end) return false;
      try {
        const d = parseDateOnlyToLocalDate(end);
        if (!d) return false;
        const today = new Date();
        d.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return d <= today;
      } catch {
        return false;
      }
    })();

    const derivedStatus = (() => {
      if (statusRaw === 'CONTRACT_ENDED' || isEndedByDate) return 'CONTRACT_ENDED';
      if (statusRaw === 'REQUEST_REDO') return 'REQUEST_REDO';
      if (statusRaw === 'COMPLETED' || (hasAdvisorSig && hasManagementSig)) return 'COMPLETED';
      if (statusRaw === 'WAITING_MANAGEMENT' || (hasAdvisorSig && !hasManagementSig)) return 'WAITING_MANAGEMENT';
      return 'WAITING_ADVISOR';
    })();

    return {
      ...raw,
      contract_type: 'ADVISOR',
      status: derivedStatus,
      latest_redo_requester_role:
        raw?.latest_redo_requester_role ||
        (statusRaw === 'REQUEST_REDO' && raw?.advisor_remarks ? 'ADVISOR' : null) ||
        (statusRaw === 'REQUEST_REDO' && raw?.management_remarks ? 'MANAGEMENT' : null),
    };
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const teachingStatus = mapServerStatusFilter(status);
      const advisorStatus = mapAdvisorStatusFilter(status);
      const [teachingResult, advisorResult] = await Promise.allSettled([
        listContracts({
          page,
          limit,
          q: q || undefined,
          status: teachingStatus,
        }),
        // Advisor listing supports q + status; status is also normalized client-side.
        listAdvisorContracts({
          page,
          limit,
          q: q || undefined,
          status: advisorStatus,
        }),
      ]);

      const teachingRes = teachingResult.status === 'fulfilled' ? teachingResult.value : null;
      const advisorRes = advisorResult.status === 'fulfilled' ? advisorResult.value : null;

      const teachingRows = Array.isArray(teachingRes?.data) ? teachingRes.data : [];
      const advisorRowsRaw = Array.isArray(advisorRes?.data) ? advisorRes.data : [];
      const advisorRows = advisorRowsRaw.map(normalizeAdvisorContract);

      const merged = [...teachingRows, ...advisorRows].sort((a, b) => {
        const at = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bt = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return bt - at;
      });

      setContracts(merged);
      const teachingTotal = Number(teachingRes?.total || teachingRows.length || 0);
      const advisorTotal = Number(advisorRes?.total || advisorRows.length || 0);
      setTotal(teachingTotal + advisorTotal);
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

      const selectedStatus = normalizeStatusValue(status);
      const contractStatus = normalizeStatusValue(c?.status);
      const displayStatus = getManagementDisplayStatus(c);

      if (selectedStatus === 'WAITING_RESPONSE') {
        return displayStatus === 'WAITING_RESPONSE';
      }

      if (selectedStatus === 'REQUEST_REDO') {
        return contractStatus === 'REQUEST_REDO' && displayStatus !== 'WAITING_RESPONSE';
      }

      return displayStatus === selectedStatus;
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
