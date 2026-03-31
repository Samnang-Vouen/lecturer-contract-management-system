import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ScheduleCreationHeader from "../../components/admin/scheduleCreation/ScheduleCreationHeader";
import ScheduleGroupGrid from "../../components/admin/scheduleCreation/ScheduleGroupGrid";
import SchedulePreviewPanel from "../../components/admin/scheduleCreation/SchedulePreviewPanel";
import EmptySessionDialog from "../../components/admin/scheduleCreation/EmptySessionDialog";
import Select, { SelectItem } from "../../components/ui/Select.jsx";
import { fallbackTimeSlots } from "../../utils/scheduleCreation";
import { subscribeCourseMappingUpdates } from "../../utils/courseMappingUpdates";
import { useScheduleCreationData } from "../../hooks/admin/scheduleCreation/useScheduleCreationData";
import { useSchedulePreview } from "../../hooks/admin/scheduleCreation/useSchedulePreview";
import { useEmptyCellDialog } from "../../hooks/admin/scheduleCreation/useEmptyCellDialog";

export default function ScheduleCreation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [specializations, setSpecializations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const [selectedSpecialization, setSelectedSpecialization] = useState(
    () => searchParams.get("specialization") || "all",
  );
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(
    () => searchParams.get("academicYear") || "all",
  );
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

  const [activeDownloadId, setActiveDownloadId] = useState(null);
  const [, setGeneratedCount] = useState(0);
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

  const selectedPreviewGroupId = searchParams.get("groupId");

  const selectedPreviewGroup = useMemo(() => {
    if (!selectedPreviewGroupId) return null;
    return groups.find((group) => String(group.id) === String(selectedPreviewGroupId)) || null;
  }, [groups, selectedPreviewGroupId]);

  const selectableSpecializations = useMemo(() => specializations.filter((spec) => spec?.id != null), [specializations]);
  const requiresSpecializationSelection = selectableSpecializations.length > 1 && selectedSpecialization === "all";

  const selectedSpecializationName = useMemo(() => {
    if (selectedSpecialization === "all") {
      if (selectableSpecializations.length === 1) return selectableSpecializations[0]?.name || "the available specialization";
      return "";
    }
    return specializations.find((spec) => String(spec.id) === String(selectedSpecialization))?.name || "the selected specialization";
  }, [selectedSpecialization, selectableSpecializations, specializations]);

  const updateSearchParams = React.useCallback((nextValues) => {
    const nextParams = new URLSearchParams();

    const academicYear = nextValues.academicYear ?? selectedAcademicYear;
    const specialization = nextValues.specialization ?? selectedSpecialization;
    const groupId = Object.prototype.hasOwnProperty.call(nextValues, "groupId")
      ? nextValues.groupId
      : selectedPreviewGroupId;

    if (academicYear && academicYear !== "all") {
      nextParams.set("academicYear", academicYear);
    }

    if (specialization && specialization !== "all") {
      nextParams.set("specialization", specialization);
    }

    if (groupId) {
      nextParams.set("groupId", String(groupId));
    }

    setSearchParams(nextParams, { replace: true });
  }, [selectedAcademicYear, selectedPreviewGroupId, selectedSpecialization, setSearchParams]);

  const refreshScheduleData = React.useCallback(async () => {
    const refreshedData = await loadPageData();
    if (!selectedPreviewGroupId) return;

    const refreshedGroups = Array.isArray(refreshedData?.groups) ? refreshedData.groups : [];
    const nextPreviewGroup = refreshedGroups.find(
      (group) => String(group.id) === String(selectedPreviewGroupId),
    );

    if (!nextPreviewGroup) {
      updateSearchParams({ groupId: null });
      return;
    }

    await handlePreviewGroup(nextPreviewGroup);
  }, [handlePreviewGroup, loadPageData, selectedPreviewGroupId, updateSearchParams]);

  useEffect(() => {
    if (selectedPreviewGroupId) return;

    setPreviewCells({});
    setPreviewTimeSlots(fallbackTimeSlots);
    setPreviewGroupId(null);
    setPreviewGroupName("");
    setPreviewStartTerm("");
    setPreviewEndTerm("");
  }, [selectedPreviewGroupId]);

  useEffect(() => {
    return subscribeCourseMappingUpdates(() => {
      refreshScheduleData();
    });
  }, [refreshScheduleData]);

  useEffect(() => {
    if (!selectedPreviewGroupId || isLoading) return;

    if (!selectedPreviewGroup) {
      updateSearchParams({ groupId: null });
      return;
    }

    handlePreviewGroup(selectedPreviewGroup);
  }, [handlePreviewGroup, isLoading, selectedPreviewGroup, selectedPreviewGroupId]);

  const handleAcademicYearChange = (value) => {
    setSelectedAcademicYear(value);
    updateSearchParams({ academicYear: value });
  };

  const handleSpecializationChange = (value) => {
    setSelectedSpecialization(value);
    updateSearchParams({ specialization: value });
  };

  const handleOpenPreview = (group) => {
    updateSearchParams({ groupId: group?.id || null });
  };

  const handleBackToGroups = () => {
    updateSearchParams({ groupId: null });
  };

  const isGroupPdfLoading = activeDownloadId === `group-${previewGroupId}`;

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <ScheduleCreationHeader
          isGenerateAllLoading={isGenerateAllLoading}
          canGenerateAll={!requiresSpecializationSelection}
          requiresSpecializationSelection={requiresSpecializationSelection}
          selectedSpecializationName={selectedSpecializationName}
          openEmptyCellDialog={openEmptyCellDialog}
        />

        {selectedPreviewGroupId ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={handleBackToGroups}
                  className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                  aria-label="Back to groups"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Schedule Preview</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">
                    {previewGroupName || selectedPreviewGroup?.name || "Loading group..."}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Review the generated schedule before exporting the PDF.</p>
                </div>
              </div>

              {selectedPreviewGroup ? (
                <button
                  type="button"
                  onClick={() => openEmptyCellDialog("single", selectedPreviewGroup)}
                  disabled={isGroupPdfLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGroupPdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {isGroupPdfLoading ? "Generating PDF..." : "Generate PDF"}
                </button>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
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
        ) : (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Filters</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Browse groups</h2>
                  <p className="mt-1 text-sm text-slate-500">Open a group card to move into the schedule preview.</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Academic Year</label>
                    <Select
                      value={selectedAcademicYear}
                      onValueChange={handleAcademicYearChange}
                      className="w-full"
                      buttonClassName="h-10 rounded-lg border-slate-300 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-blue-100"
                      oneLine
                    >
                      {academicYearOptions.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year === "all" ? "All Academic Years" : year}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Specialization</label>
                    <Select
                      value={selectedSpecialization}
                      onValueChange={handleSpecializationChange}
                      className="w-full"
                      buttonClassName="h-10 rounded-lg border-slate-300 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-blue-100"
                      oneLine
                    >
                      <SelectItem value="all">All Specializations</SelectItem>
                      {specializations.map((spec) => (
                        <SelectItem key={spec.id} value={String(spec.id)}>
                          {spec.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                  {isLoading ? "Loading available groups..." : `${visibleGroups.length} groups available`}
                </p>
              </div>
            </section>

            <ScheduleGroupGrid
              isLoading={isLoading}
              visibleGroups={visibleGroups}
              activeDownloadId={activeDownloadId}
              onPreviewGroup={handleOpenPreview}
              openEmptyCellDialog={openEmptyCellDialog}
            />
          </div>
        )}
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
