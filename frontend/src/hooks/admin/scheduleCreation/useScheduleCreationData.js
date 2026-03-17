import { useCallback, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { getGroups } from "../../../services/group.service";
import { getSpecializations } from "../../../services/specialization.service";
import { getScheduleAcademicYears } from "../../../services/scheduleCreation.service";
import { getSpecializationName, safeArray } from "../../../utils/scheduleCreation";

export function useScheduleCreationData({
  specializations,
  setSpecializations,
  groups,
  setGroups,
  academicYears,
  setAcademicYears,
  selectedSpecialization,
  selectedGroupIds,
  setSelectedGroupIds,
  setIsLoading,
}) {
  const academicYearOptions = useMemo(() => ["all", ...safeArray(academicYears)], [academicYears]);

  const selectedSpecializationName = useMemo(() => {
    if (selectedSpecialization === "all") return "";
    return specializations.find((item) => String(item.id) === String(selectedSpecialization))?.name || "";
  }, [selectedSpecialization, specializations]);

  const visibleGroups = useMemo(() => {
    return safeArray(groups).filter((group) => {
      if (!selectedSpecializationName) return true;
      return String(getSpecializationName(group?.Class)).trim() === String(selectedSpecializationName).trim();
    });
  }, [groups, selectedSpecializationName]);

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [specRes, groupsRes, yearsRes] = await Promise.all([
        getSpecializations(),
        getGroups(),
        getScheduleAcademicYears(),
      ]);
      const specPayload = specRes?.data;
      setSpecializations(Array.isArray(specPayload) ? specPayload : safeArray(specPayload?.data));
      setGroups(safeArray(groupsRes?.data?.group));
      setAcademicYears(safeArray(yearsRes?.data?.data));
    } catch (error) {
      console.error("[ScheduleCreation] failed to load page data", error);
      toast.error("Failed to load schedule data");
    } finally {
      setIsLoading(false);
    }
  }, [setAcademicYears, setGroups, setIsLoading, setSpecializations]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    setSelectedGroupIds((prev) => prev.filter((id) => visibleGroups.some((group) => group.id === id)));
  }, [setSelectedGroupIds, visibleGroups]);

  const toggleGroupSelection = useCallback((groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  }, [setSelectedGroupIds]);

  const handleSelectAllVisible = useCallback(() => {
    setSelectedGroupIds(visibleGroups.map((group) => group.id));
  }, [setSelectedGroupIds, visibleGroups]);

  const handleClearSelection = useCallback(() => {
    setSelectedGroupIds([]);
  }, [setSelectedGroupIds]);

  return {
    academicYearOptions,
    visibleGroups,
    loadPageData,
    toggleGroupSelection,
    handleSelectAllVisible,
    handleClearSelection,
  };
}