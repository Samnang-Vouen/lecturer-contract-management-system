import { useState, useEffect } from 'react';
import { 
  createContract as createTeachingContract, 
  deleteContract as deleteTeachingContract, 
  getContractPdfBlob, 
  getContractPdfUrl 
} from '../../../services/contract.service';
import { getLecturerDetail } from '../../../services/lecturer.service';
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
    
    (async () => {
      try {
        const results = await Promise.all(missing.map(async (id) => {
          try {
            const body = await getLecturerDetail(id);
            const raw = body?.hourlyRateThisYear;
            const n = raw != null ? parseFloat(String(raw).replace(/[^0-9.\-]/g, '')) : null;
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

  const previewPdf = (id) => {
    if (!id) return;
    const url = getContractPdfUrl(id);
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
      const data = await getContractPdfBlob(id);
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
