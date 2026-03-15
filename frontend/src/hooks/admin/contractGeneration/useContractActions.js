import { useState, useEffect } from 'react';
import { 
  createContract as createTeachingContract, 
  deleteContract as deleteTeachingContract, 
  getContractPdfBlob, 
  getContractPdfUrl,
  getAdvisorContractPdfBlob,
  getAdvisorContractPdfUrl
} from '../../../services/contract.service';
import { getLecturerDetail } from '../../../services/lecturer.service';
import { getAdvisorDetail } from '../../../services/advisor.service';
import { lecturerFilename } from '../../../utils/contractHelpers';

/**
 * Custom hook for contract CRUD operations and PDF handling
 */
export function useContractActions(contracts, setContracts, refreshContracts) {
  const [ratesByLecturer, setRatesByLecturer] = useState({});

  // Fetch hourly rates for lecturers
  useEffect(() => {
    const ids = Array.from(new Set((contracts || []).map(c => c.lecturer_user_id).filter(Boolean)));
    const missing = ids.filter(id => !(id in ratesByLecturer));
    if (missing.length === 0) return;

    const shouldUseAdvisorDetailByUserId = new Map();
    for (const c of (contracts || [])) {
      const userId = c?.lecturer_user_id;
      if (!userId) continue;
      const type = String(c?.contract_type || '').toUpperCase();
      const isAdvisorContract = type === 'ADVISOR';
      const prev = shouldUseAdvisorDetailByUserId.get(userId);
      if (prev === undefined) {
        // Start optimistic: if we only ever see advisor contracts for this user, use advisor endpoint.
        shouldUseAdvisorDetailByUserId.set(userId, isAdvisorContract);
      } else {
        // If any non-advisor contract exists, prefer lecturer endpoint to avoid role mismatches.
        shouldUseAdvisorDetailByUserId.set(userId, prev && isAdvisorContract);
      }
    }
    
    (async () => {
      try {
        const results = await Promise.all(missing.map(async (id) => {
          try {
            // Avoid noisy 404s: if this user only appears in ADVISOR contracts, call advisor detail directly.
            const useAdvisorDetail = shouldUseAdvisorDetailByUserId.get(id) === true;
            const body = useAdvisorDetail ? await getAdvisorDetail(id) : await getLecturerDetail(id);
            const raw = body?.hourlyRateThisYear;
            const n = raw != null ? parseFloat(String(raw).replace(/[^0-9.-]/g, '')) : null;
            return [id, Number.isFinite(n) ? n : null];
          } catch {
            return [id, null];
          }
        }));
        setRatesByLecturer(prev => {
          const next = { ...prev };
          for (const [id, rate] of results) next[id] = rate;
          return next;
        });
      } catch {
        // ignore batch errors
      }
    })();
  }, [contracts, ratesByLecturer]);

  const createContract = async (payload) => {
    const body = await createTeachingContract(payload);
    await refreshContracts();
    return body;
  };

  const deleteContract = async (id) => {
    if (!id) return { ok: false, message: 'Invalid id' };
    try {
      await deleteTeachingContract(id);
      setContracts(prev => prev.filter(c => c.id !== id));
      return { ok: true };
    } catch (e) {
      const message = e?.response?.data?.message || 'Failed to delete contract';
      console.error('Failed to delete contract', e);
      return { ok: false, message };
    }
  };

  const previewPdf = (input) => {
    if (!input) return;
    const c = (typeof input === 'object' && input) ? input : (contracts || []).find(x => x.id === input);
    const id = (typeof input === 'object' && input) ? input.id : input;
    if (!id) return;
    const type = String(c?.contract_type || '').toUpperCase();
    const url = type === 'ADVISOR' ? getAdvisorContractPdfUrl(id) : getContractPdfUrl(id);
    window.open(url, '_blank');
  };

  const downloadPdf = async (input) => {
    if (!input) return;
    const c = (typeof input === 'object' && input) ? input : (contracts || []).find(x => x.id === input);
    const id = (typeof input === 'object' && input) ? input.id : input;
    if (!id) return;
    let filename = (c && c.lecturer) ? lecturerFilename(c.lecturer) : null;
    if (!filename) filename = `contract-${id}.pdf`;
    try {
      const type = String(c?.contract_type || '').toUpperCase();
      const data = type === 'ADVISOR' ? await getAdvisorContractPdfBlob(id) : await getContractPdfBlob(id);
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore download errors
    }
  };

  return {
    ratesByLecturer,
    createContract,
    deleteContract,
    previewPdf,
    downloadPdf,
  };
}
