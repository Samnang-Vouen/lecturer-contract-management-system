import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { listRateHourReport, updateRateHourRow } from '../../services/hourlyRate.service';
import {
  buildDrafts,
  buildTrailingAcademicYears,
  getDefaultAcademicYear,
  getNextAcademicYear,
  normalizeAcademicYear,
  sortAcademicYears,
} from '../../utils/rateHour';

export function useRateHourPageData(authUser) {
  const defaultAcademicYear = getDefaultAcademicYear();
  const [academicYear, setAcademicYear] = useState('');
  const [report, setReport] = useState({
    academicYear: defaultAcademicYear,
    latestAcademicYear: defaultAcademicYear,
    lecturers: [],
    rateAcademicYears: buildTrailingAcademicYears(defaultAcademicYear, 3),
    previousAcademicYears: buildTrailingAcademicYears(defaultAcademicYear, 3).slice(0, 2),
    nextAcademicYear: getNextAcademicYear(defaultAcademicYear),
  });
  const [drafts, setDrafts] = useState({});
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null);

  const loadReport = useCallback(async (showRefreshState = false) => {
    const requestedAcademicYear = String(academicYear || '').trim();
    const hasRequestedAcademicYear = /^\d{4}-\d{4}$/.test(requestedAcademicYear);
    const normalizedAcademicYear = hasRequestedAcademicYear
      ? normalizeAcademicYear(requestedAcademicYear)
      : null;

    try {
      showRefreshState ? setIsRefreshing(true) : setIsLoading(true);
      const data = await listRateHourReport(
        normalizedAcademicYear ? { academicYear: normalizedAcademicYear } : undefined
      );
      const rateAcademicYears = sortAcademicYears(
        data.rateAcademicYears?.length
          ? data.rateAcademicYears
          : buildTrailingAcademicYears(data.academicYear || defaultAcademicYear, 3)
      );

      setAcademicYear(data.academicYear || normalizedAcademicYear || '');
      setReport({
        academicYear: data.academicYear || normalizedAcademicYear || defaultAcademicYear,
        latestAcademicYear:
          data.latestAcademicYear || data.academicYear || normalizedAcademicYear || defaultAcademicYear,
        lecturers: data.lecturers || [],
        rateAcademicYears,
        previousAcademicYears: data.previousAcademicYears || [],
        nextAcademicYear: data.nextAcademicYear,
      });
      setDrafts(buildDrafts(data.lecturers || [], rateAcademicYears, data.nextAcademicYear));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load rate hour report');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [academicYear, defaultAcademicYear]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const rateAcademicYears = useMemo(() => {
    const fallbackYears = buildTrailingAcademicYears(report.latestAcademicYear || academicYear, 3);
    return report.rateAcademicYears?.length ? report.rateAcademicYears : fallbackYears;
  }, [report.rateAcademicYears, report.latestAcademicYear, academicYear]);

  const latestAcademicYear = report.latestAcademicYear || normalizeAcademicYear(academicYear);
  const totalColumns = 5 + rateAcademicYears.length + 6 + 4 + 6;
  const tableMinWidth = `${1620 + Math.max(rateAcademicYears.length, 3) * 140 + 110}px`;

  const departmentOptions = useMemo(() => Array.from(
    new Set(report.lecturers.map((row) => row.department?.englishName).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right)), [report.lecturers]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return report.lecturers.filter((row) => {
      const matchesDepartment = departmentFilter === 'all' || row.department?.englishName === departmentFilter;
      if (!matchesDepartment) return false;
      if (!keyword) return true;
      const haystack = [
        row.department?.englishName,
        row.department?.khmerName,
        row.lecturer?.englishName,
        row.lecturer?.khmerName,
        row.lecturer?.englishTitle,
        row.lecturer?.khmerTitle,
      ].join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
  }, [departmentFilter, report.lecturers, search]);

  const visibleDepartmentLabel = useMemo(() => {
    if (departmentFilter !== 'all') return departmentFilter;
    const adminDepartment = String(
      authUser?.department || authUser?.department_name || authUser?.departmentName || ''
    ).trim();
    if (adminDepartment) return adminDepartment;
    const uniqueDepartments = Array.from(new Set(filteredRows.map((row) => row.department?.englishName).filter(Boolean)));
    return uniqueDepartments.length === 1 ? uniqueDepartments[0] : 'All departments';
  }, [authUser?.department, authUser?.department_name, authUser?.departmentName, departmentFilter, filteredRows]);

  const stats = useMemo(() => {
    const feedbackRows = filteredRows.map((row) => row.summary?.averageFeedback).filter((value) => value != null);
    return {
      totalLecturers: filteredRows.length,
      increasedCount: filteredRows.filter((row) => row.summary?.increaseRateApplied).length,
      totalHours: filteredRows.reduce((sum, row) => sum + Number(row.summary?.totalHours || 0), 0),
      averageFeedback: feedbackRows.length
        ? feedbackRows.reduce((sum, value) => sum + Number(value || 0), 0) / feedbackRows.length
        : null,
    };
  }, [filteredRows]);

  const updateDraftIncreaseRate = useCallback((lecturerId, value) => {
    setDrafts((prev) => ({
      ...prev,
      [lecturerId]: { ...(prev[lecturerId] || { rates: {}, remark: '' }), increaseRate: value, rates: { ...(prev[lecturerId]?.rates || {}) } },
    }));
  }, []);

  const updateDraftRemark = useCallback((lecturerId, value) => {
    setDrafts((prev) => ({
      ...prev,
      [lecturerId]: { ...(prev[lecturerId] || { rates: {}, remark: '' }), rates: { ...(prev[lecturerId]?.rates || {}) }, remark: value },
    }));
  }, []);

  const handleSaveRow = useCallback(async (row) => {
    const draft = drafts[row.lecturerId];
    if (!draft) return;

    try {
      setSavingRowId(row.lecturerId);
      await updateRateHourRow(row.lecturerId, {
        currentAcademicYear: normalizeAcademicYear(academicYear),
        increaseRate: draft.increaseRate || '',
        remark: draft.remark,
      });
      toast.success(`Saved rate hour data for ${row.lecturer.englishName || 'lecturer'}`);
      await loadReport(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save rate hour data');
    } finally {
      setSavingRowId(null);
    }
  }, [academicYear, drafts, loadReport]);

  return {
    academicYear,
    setAcademicYear,
    defaultAcademicYear,
    report,
    drafts,
    search,
    setSearch,
    departmentFilter,
    setDepartmentFilter,
    isLoading,
    isRefreshing,
    savingRowId,
    loadReport,
    rateAcademicYears,
    latestAcademicYear,
    totalColumns,
    tableMinWidth,
    departmentOptions,
    filteredRows,
    visibleDepartmentLabel,
    stats,
    updateDraftIncreaseRate,
    updateDraftRemark,
    handleSaveRow,
  };
}