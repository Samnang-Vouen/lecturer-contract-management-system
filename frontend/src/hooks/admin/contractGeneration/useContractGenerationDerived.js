import { useEffect, useMemo, useState } from 'react';
import { listContracts } from '../../../services/contract.service';
import { normalizeSearchText, normalizeStatus, stripHonorific } from './contractGenerationPage.helpers';

export function useContractGenerationDerived({ contractData, contractMappings, advisorContracts }) {
  const [teachingBaseTotal, setTeachingBaseTotal] = useState(0);

  useEffect(() => {
    const years = Array.from(new Set((contractData.contracts || []).map((contract) => contract.academic_year).filter(Boolean)));
    const missingYears = years.filter((year) => !(year in contractMappings.mappingsByYear));
    if (!missingYears.length) return;
    Promise.all(missingYears.map((year) => contractMappings.fetchMappingsForYear(year)));
  }, [contractData.contracts, contractMappings]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const body = await listContracts({
          page: 1,
          limit: 1,
          q: contractData.search || undefined,
          academic_year: contractData.listAcademicYear || undefined,
        });
        if (mounted) setTeachingBaseTotal(Number(body?.total || 0) || 0);
      } catch {
        if (mounted) setTeachingBaseTotal(0);
      }
    })();
    return () => { mounted = false; };
  }, [contractData.search, contractData.listAcademicYear]);

  const advisorBaseTotal = useMemo(() => {
    const query = stripHonorific(normalizeSearchText(contractData.search || ''));
    if (!query) return (advisorContracts || []).length;
    return (advisorContracts || []).filter((contract) => {
      const title = normalizeSearchText(contract.lecturer?.LecturerProfile?.title || contract.lecturer?.title || '');
      const name = normalizeSearchText(contract.lecturer?.display_name || contract.lecturer?.full_name || contract.lecturer?.email || '');
      return stripHonorific(`${title ? `${title} ` : ''}${name}`.trim()).startsWith(query);
    }).length;
  }, [advisorContracts, contractData.search]);

  const filteredContracts = useMemo(() => {
    const query = stripHonorific(normalizeSearchText(contractData.search || ''));
    const statusNeedle = normalizeStatus(contractData.statusFilter);
    const pool = [...(contractData.contracts || []), ...(advisorContracts || [])];
    const byStatus = !statusNeedle ? pool : pool.filter((contract) => normalizeStatus(contract?.status) === statusNeedle);
    if (!query) return byStatus;
    return byStatus.filter((contract) => {
      const title = normalizeSearchText(contract.lecturer?.LecturerProfile?.title || contract.lecturer?.title || '');
      const name = normalizeSearchText(contract.lecturer?.display_name || contract.lecturer?.full_name || contract.lecturer?.email || '');
      return stripHonorific(`${title ? `${title} ` : ''}${name}`.trim()).startsWith(query);
    });
  }, [advisorContracts, contractData.contracts, contractData.search, contractData.statusFilter]);

  return { teachingBaseTotal, advisorBaseTotal, totalBase: teachingBaseTotal + advisorBaseTotal, filteredContracts };
}