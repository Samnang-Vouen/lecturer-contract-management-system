import { useEffect, useMemo, useState } from 'react';
import { getAcceptedMappings, listCourseMappings } from '../../../services/courseMapping.service';
import { listLecturers } from '../../../services/lecturer.service';
import { aggregateContractMappings } from '../../../utils/contractHelpers';
import { buildSelectionState } from './contractRedoEdit.helpers';

export function useContractRedoEditMappings({
  open,
  advisor,
  contract,
  currentAcademicYear,
  mappings,
  mappingsByYear,
  fetchMappingsForYear,
  mappingUserId,
  contractLecturerId,
  contractLecturerProfileId,
  teachAcademicYear,
  courseQuery,
  didInitSelection,
  setDidInitSelection,
  setSelectedMappingIds,
  setCombineByMapping,
}) {
  const canSelectFromMappings = useMemo(
    () => Array.isArray(mappings) || (mappingsByYear && typeof mappingsByYear === 'object'),
    [mappings, mappingsByYear]
  );
  const [dialogYearMappings, setDialogYearMappings] = useState(null);

  const effectiveTeachYear = useMemo(
    () => String(teachAcademicYear || contract?.academic_year || currentAcademicYear || '').trim(),
    [teachAcademicYear, contract, currentAcademicYear]
  );

  const yearMappings = useMemo(() => {
    if (!effectiveTeachYear) return [];
    if (Array.isArray(dialogYearMappings)) return dialogYearMappings;
    const nextYearMappings = mappingsByYear && typeof mappingsByYear === 'object' ? mappingsByYear?.[effectiveTeachYear] : null;
    if (Array.isArray(nextYearMappings)) return nextYearMappings;
    if (currentAcademicYear && effectiveTeachYear === String(currentAcademicYear)) return Array.isArray(mappings) ? mappings : [];
    return [];
  }, [dialogYearMappings, effectiveTeachYear, currentAcademicYear, mappings, mappingsByYear]);

  const normalizedYearMappings = useMemo(
    () => aggregateContractMappings(yearMappings),
    [yearMappings]
  );

  const filteredMappings = useMemo(() => {
    const query = String(courseQuery || '').toLowerCase().trim();
    return normalizedYearMappings.filter((mapping) => {
      const status = String(mapping?.status || '').toLowerCase();
      if (status && status !== 'accepted') return false;
      if (contractLecturerId && typeof mappingUserId === 'function') {
        const mappingLecturerId = mappingUserId(mapping);
        if (mappingLecturerId && mappingLecturerId !== contractLecturerId) return false;
      }
      if (!query) return true;
      const courseName = (mapping?.course?.name || '').toLowerCase();
      const courseCode = (mapping?.course?.code || '').toLowerCase();
      const className = (mapping?.class?.name || '').toLowerCase();
      const meta = `${mapping?.term || ''} ${mapping?.year_level || ''}`.toLowerCase();
      return courseName.includes(query) || courseCode.includes(query) || className.includes(query) || meta.includes(query);
    });
  }, [normalizedYearMappings, courseQuery, contractLecturerId, mappingUserId]);

  useEffect(() => {
    let cancelled = false;

    setDialogYearMappings(null);

    if (!open || advisor || !effectiveTeachYear || (!contractLecturerProfileId && !contractLecturerId)) {
      return () => {
        cancelled = true;
      };
    }

    const fetchAllPages = async (fetchPage) => {
      let page = 1;
      let totalPages = 1;
      const out = [];
      const seen = new Set();
      do {
        const body = await fetchPage(page);
        const rows = Array.isArray(body?.data) ? body.data : [];
        for (const row of rows) {
          const key = String(row?.id ?? '');
          if (!key || seen.has(key)) continue;
          seen.add(key);
          out.push(row);
        }
        if (typeof body?.hasMore === 'boolean') {
          if (!body.hasMore) break;
        }
        totalPages = body?.totalPages || totalPages;
        if (page >= totalPages) break;
        page += 1;
      } while (page <= totalPages);
      return out;
    };

    const yearMatches = (mapping) => {
      const mappingYear = String(mapping?.academic_year || '').trim();
      const classYear = String(mapping?.class?.academic_year || '').trim();
      return mappingYear === effectiveTeachYear || classYear === effectiveTeachYear;
    };

    (async () => {
      try {
        let lecturerProfileId = contractLecturerProfileId;

        if (!lecturerProfileId && contractLecturerId) {
          let page = 1;
          let totalPages = 1;
          do {
            const body = await listLecturers({ page, limit: 100 });
            const rows = Array.isArray(body?.data) ? body.data : [];
            const match = rows.find((row) => String(row?.id ?? '') === String(contractLecturerId));
            if (match?.lecturerProfileId) {
              lecturerProfileId = String(match.lecturerProfileId);
              break;
            }
            totalPages = body?.meta?.totalPages || page;
            page += 1;
          } while (page <= totalPages);
        }

        if (!lecturerProfileId) {
          if (!cancelled) setDialogYearMappings([]);
          return;
        }

        let collected = await fetchAllPages((page) => getAcceptedMappings({
          academic_year: effectiveTeachYear,
          lecturer_profile_id: lecturerProfileId,
          limit: 100,
          page,
        }));

        if (!collected.length) {
          collected = await fetchAllPages((page) => listCourseMappings({
            academic_year: effectiveTeachYear,
            lecturer_profile_id: lecturerProfileId,
            status: 'Accepted',
            limit: 100,
            page,
          }));
        }

        if (!cancelled) setDialogYearMappings(collected.filter(yearMatches));
      } catch {
        if (!cancelled) setDialogYearMappings([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, advisor, effectiveTeachYear, contractLecturerId, contractLecturerProfileId]);

  useEffect(() => {
    if (!open || advisor || !effectiveTeachYear) return;
    if (!/^\d{4}-\d{4}$/.test(String(effectiveTeachYear))) return;
    if (typeof fetchMappingsForYear === 'function') fetchMappingsForYear(effectiveTeachYear);
  }, [open, advisor, effectiveTeachYear, currentAcademicYear, fetchMappingsForYear]);

  useEffect(() => {
    if (!open || advisor || didInitSelection) return;
    if (!canSelectFromMappings) {
      setDidInitSelection(true);
      return;
    }
    if (!Array.isArray(normalizedYearMappings) || normalizedYearMappings.length === 0) return;
    const nextState = buildSelectionState({ yearMappings: normalizedYearMappings, contract, contractLecturerId, mappingUserId });
    setSelectedMappingIds(nextState.selected);
    setCombineByMapping(nextState.combined);
    setDidInitSelection(true);
  }, [
    open,
    advisor,
    didInitSelection,
    canSelectFromMappings,
    normalizedYearMappings,
    contract,
    contractLecturerId,
    mappingUserId,
    setDidInitSelection,
    setSelectedMappingIds,
    setCombineByMapping,
  ]);

  return {
    canSelectFromMappings,
    effectiveTeachYear,
    yearMappings: normalizedYearMappings,
    filteredMappings,
  };
}