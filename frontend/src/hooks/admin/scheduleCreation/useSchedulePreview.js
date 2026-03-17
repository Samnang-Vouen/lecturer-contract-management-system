import { useCallback } from "react";
import toast from "react-hot-toast";
import {
  generateScheduleHtml,
  getGeneratedSchedulePdf,
  listAllAcceptedMappingsForGroup,
} from "../../../services/scheduleCreation.service";
import {
  buildPreviewGridFromMappings,
  fallbackTimeSlots,
} from "../../../utils/scheduleCreation";

export function useSchedulePreview({
  selectedAcademicYear,
  selectedSpecialization,
  selectedGroupIds,
  visibleGroups,
  setPreviewCells,
  setPreviewTimeSlots,
  setPreviewGroupId,
  setPreviewGroupName,
  setPreviewStartTerm,
  setPreviewEndTerm,
  setIsPreviewLoading,
  setIsGenerateAllLoading,
  setActiveDownloadId,
  setGeneratedCount,
}) {
  const fetchMappingsForGroup = useCallback((groupId) => {
    return listAllAcceptedMappingsForGroup({
      groupId,
      academicYear: selectedAcademicYear,
    });
  }, [selectedAcademicYear]);

  const downloadGeneratedSchedulePdf = useCallback(async (filename, file) => {
    const response = await getGeneratedSchedulePdf(file);
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  const handlePreviewGroup = useCallback(async (group) => {
    setIsPreviewLoading(true);
    try {
      setPreviewGroupId(group?.id ?? null);
      setPreviewGroupName(group?.name || "");
      setPreviewStartTerm(group?.Class?.start_term || "");
      setPreviewEndTerm(group?.Class?.end_term || "");

      const mappings = await fetchMappingsForGroup(group?.id);
      setPreviewTimeSlots(fallbackTimeSlots);
      setPreviewCells(buildPreviewGridFromMappings(mappings));
    } catch (error) {
      console.error("[ScheduleCreation] failed to preview schedule", error);
      toast.error("Failed to load schedule preview");
    } finally {
      setIsPreviewLoading(false);
    }
  }, [
    fetchMappingsForGroup,
    setIsPreviewLoading,
    setPreviewCells,
    setPreviewEndTerm,
    setPreviewGroupId,
    setPreviewGroupName,
    setPreviewStartTerm,
    setPreviewTimeSlots,
  ]);

  const handleGenerateGroupPdf = useCallback(async (group, customCellsByGroup) => {
    const groupKey = `group-${group?.id}`;
    setActiveDownloadId(groupKey);
    try {
      const response = await generateScheduleHtml({
        academic_year: selectedAcademicYear !== "all" ? selectedAcademicYear : undefined,
        group_ids: [group?.id].filter(Boolean),
        custom_cells_by_group: customCellsByGroup,
      });

      await downloadGeneratedSchedulePdf(
        `schedule-${String(group?.name || "group").replace(/\s+/g, "-").toLowerCase()}.pdf`,
        response?.data?.file,
      );
      setGeneratedCount((prev) => prev + 1);
    } catch (error) {
      console.error("[ScheduleCreation] failed to generate group PDF", error);
      toast.error("Failed to generate PDF for this group");
    } finally {
      setActiveDownloadId(null);
    }
  }, [downloadGeneratedSchedulePdf, selectedAcademicYear, setActiveDownloadId, setGeneratedCount]);

  const handleGenerateAll = useCallback(async (customCellsByGroup) => {
    setIsGenerateAllLoading(true);
    try {
      const groupIds = selectedGroupIds.length > 0 ? selectedGroupIds : visibleGroups.map((group) => group.id);
      const response = await generateScheduleHtml({
        academic_year: selectedAcademicYear !== "all" ? selectedAcademicYear : undefined,
        specialization_id: selectedSpecialization !== "all" ? Number(selectedSpecialization) : undefined,
        group_ids: groupIds.length > 0 ? groupIds : undefined,
        custom_cells_by_group: customCellsByGroup,
      });

      await downloadGeneratedSchedulePdf("all-schedules.pdf", response?.data?.file);
      setGeneratedCount((prev) => prev + Math.max(groupIds.length, 1));
    } catch (error) {
      console.error("[ScheduleCreation] failed to generate all PDFs", error);
      toast.error("Failed to generate all PDFs");
    } finally {
      setIsGenerateAllLoading(false);
    }
  }, [
    downloadGeneratedSchedulePdf,
    selectedAcademicYear,
    selectedGroupIds,
    selectedSpecialization,
    setGeneratedCount,
    setIsGenerateAllLoading,
    visibleGroups,
  ]);

  return {
    handlePreviewGroup,
    handleGenerateGroupPdf,
    handleGenerateAll,
    fetchMappingsForGroup,
  };
}