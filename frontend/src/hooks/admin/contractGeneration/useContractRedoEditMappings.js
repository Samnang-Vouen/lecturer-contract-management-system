import { useEffect, useMemo } from 'react';
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

  const effectiveTeachYear = useMemo(
    () => String(teachAcademicYear || contract?.academic_year || currentAcademicYear || '').trim(),
    [teachAcademicYear, contract, currentAcademicYear]
  );

  const yearMappings = useMemo(() => {
    if (!effectiveTeachYear) return [];
    if (currentAcademicYear && effectiveTeachYear === String(currentAcademicYear)) return Array.isArray(mappings) ? mappings : [];
    const nextYearMappings = mappingsByYear && typeof mappingsByYear === 'object' ? mappingsByYear?.[effectiveTeachYear] : null;
    return Array.isArray(nextYearMappings) ? nextYearMappings : [];
  }, [effectiveTeachYear, currentAcademicYear, mappings, mappingsByYear]);

  const filteredMappings = useMemo(() => {
    const query = String(courseQuery || '').toLowerCase().trim();
    return (Array.isArray(yearMappings) ? yearMappings : []).filter((mapping) => {
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
  }, [yearMappings, courseQuery, contractLecturerId, mappingUserId]);

  useEffect(() => {
    if (!open || advisor || !effectiveTeachYear) return;
    if (!/^\d{4}-\d{4}$/.test(String(effectiveTeachYear))) return;
    if (currentAcademicYear && effectiveTeachYear === String(currentAcademicYear)) return;
    if (typeof fetchMappingsForYear === 'function') fetchMappingsForYear(effectiveTeachYear);
  }, [open, advisor, effectiveTeachYear, currentAcademicYear, fetchMappingsForYear]);

  useEffect(() => {
    if (!open || advisor || didInitSelection) return;
    if (!canSelectFromMappings) {
      setDidInitSelection(true);
      return;
    }
    if (!Array.isArray(yearMappings) || yearMappings.length === 0) return;
    const nextState = buildSelectionState({ yearMappings, contract, contractLecturerId, mappingUserId });
    setSelectedMappingIds(nextState.selected);
    setCombineByMapping(nextState.combined);
    setDidInitSelection(true);
  }, [
    open,
    advisor,
    didInitSelection,
    canSelectFromMappings,
    yearMappings,
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
    yearMappings,
    filteredMappings,
  };
}