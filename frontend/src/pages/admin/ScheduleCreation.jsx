import React, { useState } from "react";
import ScheduleCreationHeader from "../../components/admin/scheduleCreation/ScheduleCreationHeader";
import ScheduleCreationSidebar from "../../components/admin/scheduleCreation/ScheduleCreationSidebar";
import SchedulePreviewPanel from "../../components/admin/scheduleCreation/SchedulePreviewPanel";
import EmptySessionDialog from "../../components/admin/scheduleCreation/EmptySessionDialog";
import { fallbackTimeSlots } from "../../utils/scheduleCreation";
import { useScheduleCreationData } from "../../hooks/admin/scheduleCreation/useScheduleCreationData";
import { useSchedulePreview } from "../../hooks/admin/scheduleCreation/useSchedulePreview";
import { useEmptyCellDialog } from "../../hooks/admin/scheduleCreation/useEmptyCellDialog";

export default function ScheduleCreation() {
  const [specializations, setSpecializations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("all");
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  const [previewCells, setPreviewCells] = useState({});
  const [previewTimeSlots, setPreviewTimeSlots] = useState(fallbackTimeSlots);
  const [previewGroupId, setPreviewGroupId] = useState(null);
  const [previewGroupName, setPreviewGroupName] = useState("");
  const [previewStartTerm, setPreviewStartTerm] = useState("");
  const [previewEndTerm, setPreviewEndTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGenerateAllLoading, setIsGenerateAllLoading] = useState(false);
  const [isGenerateSelectedLoading, setIsGenerateSelectedLoading] = useState(false);

  const [activeDownloadId, setActiveDownloadId] = useState(null);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [emptyCellDialog, setEmptyCellDialog] = useState({
    open: false,
    scope: null,
    group: null,
    sessions: [],
    loading: false,
  });
  const [emptyCellText, setEmptyCellText] = useState("");
  const [selectedEmptySessionKeys, setSelectedEmptySessionKeys] = useState([]);

  const {
    academicYearOptions,
    visibleGroups,
    loadPageData,
    toggleGroupSelection,
    handleSelectAllVisible,
    handleClearSelection,
  } = useScheduleCreationData({
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
  });

  const {
    handlePreviewGroup,
    handleGenerateGroupPdf,
    handleGenerateAll,
    fetchMappingsForGroup,
  } = useSchedulePreview({
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
  });

  const {
    openEmptyCellDialog,
    closeEmptyCellDialog,
    handleConfirmEmptyCellDialog,
    handleGenerateWithBlankEmptyCells,
    toggleEmptySessionSelection,
    selectAllEmptySessions,
    clearAllEmptySessions,
    allEmptySessionsSelected,
    noEmptySessionsSelected,
  } = useEmptyCellDialog({
    selectedAcademicYear,
    selectedGroupIds,
    visibleGroups,
    emptyCellDialog,
    setEmptyCellDialog,
    emptyCellText,
    setEmptyCellText,
    selectedEmptySessionKeys,
    setSelectedEmptySessionKeys,
    handleGenerateGroupPdf,
    handleGenerateAll,
  });

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <ScheduleCreationHeader
          isGenerateAllLoading={isGenerateAllLoading}
          openEmptyCellDialog={openEmptyCellDialog}
        />

        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 shadow-sm xl:grid-cols-[240px_1fr]">
          <ScheduleCreationSidebar
            isLoading={isLoading}
            academicYearOptions={academicYearOptions}
            selectedAcademicYear={selectedAcademicYear}
            setSelectedAcademicYear={setSelectedAcademicYear}
            selectedSpecialization={selectedSpecialization}
            setSelectedSpecialization={setSelectedSpecialization}
            specializations={specializations}
            visibleGroups={visibleGroups}
            previewGroupId={previewGroupId}
            activeDownloadId={activeDownloadId}
            handlePreviewGroup={handlePreviewGroup}
            openEmptyCellDialog={openEmptyCellDialog}
          />

          <SchedulePreviewPanel
            previewGroupName={previewGroupName}
            previewStartTerm={previewStartTerm}
            previewEndTerm={previewEndTerm}
            isPreviewLoading={isPreviewLoading}
            previewTimeSlots={previewTimeSlots}
            previewCells={previewCells}
          />
        </div>
      </div>

      <EmptySessionDialog
        emptyCellDialog={emptyCellDialog}
        closeEmptyCellDialog={closeEmptyCellDialog}
        emptyCellText={emptyCellText}
        setEmptyCellText={setEmptyCellText}
        allEmptySessionsSelected={allEmptySessionsSelected}
        noEmptySessionsSelected={noEmptySessionsSelected}
        selectAllEmptySessions={selectAllEmptySessions}
        clearAllEmptySessions={clearAllEmptySessions}
        selectedEmptySessionKeys={selectedEmptySessionKeys}
        toggleEmptySessionSelection={toggleEmptySessionSelection}
        handleGenerateWithBlankEmptyCells={handleGenerateWithBlankEmptyCells}
        handleConfirmEmptyCellDialog={handleConfirmEmptyCellDialog}
      />
    </div>
  );
}
