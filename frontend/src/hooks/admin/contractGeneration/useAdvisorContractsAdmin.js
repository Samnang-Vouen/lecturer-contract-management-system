import { useCallback, useEffect } from 'react';
import { getAdvisorContract, listAdvisorContracts } from '../../../services/advisorContract.service';
import { normalizeAdvisorContract } from './contractGenerationPage.helpers';

export function useAdvisorContractsAdmin({ setAdvisorContracts, setAdvisorTotal, setAdvisorLoading }) {
  const fetchAllAdvisorContracts = useCallback(async () => {
    try {
      setAdvisorLoading(true);
      const limit = 100;
      let page = 1;
      let total = 0;
      const rows = [];
      while (true) {
        const body = await listAdvisorContracts({ page, limit });
        const nextRows = Array.isArray(body?.data) ? body.data : [];
        total = Number(body?.total || 0);
        rows.push(...nextRows);
        if (nextRows.length < limit || (total && rows.length >= total)) break;
        page += 1;
      }
      setAdvisorContracts(rows.map(normalizeAdvisorContract));
      setAdvisorTotal(total || rows.length);
    } catch (error) {
      console.error('Failed to fetch advisor contracts:', error);
      setAdvisorContracts([]);
      setAdvisorTotal(0);
    } finally {
      setAdvisorLoading(false);
    }
  }, [setAdvisorContracts, setAdvisorLoading, setAdvisorTotal]);

  const refreshSingleAdvisorContract = useCallback(async (id) => {
    if (!id) {
      await fetchAllAdvisorContracts();
      return;
    }
    try {
      const fresh = await getAdvisorContract(id);
      const normalized = normalizeAdvisorContract(fresh);
      setAdvisorContracts((prev) => [normalized, ...(prev || []).filter((item) => item?.id !== normalized.id)]);
      setAdvisorTotal((prev) => (Number.isFinite(prev) ? prev + 1 : prev));
    } catch {
      await fetchAllAdvisorContracts();
    }
  }, [fetchAllAdvisorContracts, setAdvisorContracts, setAdvisorTotal]);

  useEffect(() => {
    fetchAllAdvisorContracts();
  }, [fetchAllAdvisorContracts]);

  useEffect(() => {
    const maybeRefresh = () => {
      try {
        if (document.visibilityState && document.visibilityState !== 'visible') return;
      } catch {
        // ignore
      }
      fetchAllAdvisorContracts();
    };

    window.addEventListener('focus', maybeRefresh);
    document.addEventListener('visibilitychange', maybeRefresh);
    const interval = window.setInterval(maybeRefresh, 30000);
    return () => {
      window.removeEventListener('focus', maybeRefresh);
      document.removeEventListener('visibilitychange', maybeRefresh);
      window.clearInterval(interval);
    };
  }, [fetchAllAdvisorContracts]);

  return { fetchAllAdvisorContracts, refreshSingleAdvisorContract };
}