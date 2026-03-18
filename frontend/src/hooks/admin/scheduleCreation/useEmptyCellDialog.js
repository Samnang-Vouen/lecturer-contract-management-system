import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { listAllAcceptedMappingsForGroup } from "../../../services/scheduleCreation.service";
import {
  buildCustomCellsByGroupFromSelection,
  buildPreviewGridFromMappings,
  collectEmptySessions,
} from "../../../utils/scheduleCreation";

export function useEmptyCellDialog({
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
}) {
  const openEmptyCellDialog = useCallback(async (scope, group = null) => {
    setEmptyCellText("");
    setSelectedEmptySessionKeys([]);
    setEmptyCellDialog({ open: true, scope, group, sessions: [], loading: true });

    try {
      const targetGroups = scope === "single" && group
        ? [group]
        : (selectedGroupIds.length > 0
            ? visibleGroups.filter((item) => selectedGroupIds.includes(item.id))
            : visibleGroups);

      const sessionGroups = await Promise.all(
        targetGroups.map(async (targetGroup) => {
          const mappings = await listAllAcceptedMappingsForGroup({
            groupId: targetGroup?.id,
            academicYear: selectedAcademicYear,
          });
          return collectEmptySessions({
            grid: buildPreviewGridFromMappings(mappings),
            group: targetGroup,
          });
        }),
      );

      const sessions = sessionGroups.flat();
      setSelectedEmptySessionKeys(sessions.map((session) => session.key));
      setEmptyCellDialog({ open: true, scope, group, sessions, loading: false });
    } catch (error) {
      console.error("[ScheduleCreation] failed to load empty sessions", error);
      toast.error("Failed to load empty sessions");
      setEmptyCellDialog({ open: false, scope: null, group: null, sessions: [], loading: false });
    }
  }, [
    selectedAcademicYear,
    selectedGroupIds,
    setEmptyCellDialog,
    setEmptyCellText,
    setSelectedEmptySessionKeys,
    visibleGroups,
  ]);

  const closeEmptyCellDialog = useCallback(() => {
    setEmptyCellDialog({ open: false, scope: null, group: null, sessions: [], loading: false });
    setEmptyCellText("");
    setSelectedEmptySessionKeys([]);
  }, [setEmptyCellDialog, setEmptyCellText, setSelectedEmptySessionKeys]);

  const handleConfirmEmptyCellDialog = useCallback(async () => {
    const pendingGroup = emptyCellDialog.group;
    const pendingScope = emptyCellDialog.scope;
    const customCellsByGroup = buildCustomCellsByGroupFromSelection({
      sessions: emptyCellDialog.sessions,
      selectedKeys: selectedEmptySessionKeys,
      text: emptyCellText,
    });

    closeEmptyCellDialog();

    if (pendingScope === "single" && pendingGroup) {
      await handleGenerateGroupPdf(pendingGroup, customCellsByGroup);
      return;
    }

    if (pendingScope === "all") {
      await handleGenerateAll(customCellsByGroup);
    }
  }, [
    closeEmptyCellDialog,
    emptyCellDialog.group,
    emptyCellDialog.scope,
    emptyCellDialog.sessions,
    emptyCellText,
    handleGenerateAll,
    handleGenerateGroupPdf,
    selectedEmptySessionKeys,
  ]);

  const handleGenerateWithBlankEmptyCells = useCallback(async () => {
    const pendingGroup = emptyCellDialog.group;
    const pendingScope = emptyCellDialog.scope;
    closeEmptyCellDialog();

    if (pendingScope === "single" && pendingGroup) {
      await handleGenerateGroupPdf(pendingGroup, undefined);
      return;
    }

    if (pendingScope === "all") {
      await handleGenerateAll(undefined);
    }
  }, [
    closeEmptyCellDialog,
    emptyCellDialog.group,
    emptyCellDialog.scope,
    handleGenerateAll,
    handleGenerateGroupPdf,
  ]);

  const toggleEmptySessionSelection = useCallback((sessionKey, checked) => {
    setSelectedEmptySessionKeys((prev) => {
      if (checked) return prev.includes(sessionKey) ? prev : [...prev, sessionKey];
      return prev.filter((key) => key !== sessionKey);
    });
  }, [setSelectedEmptySessionKeys]);

  const selectAllEmptySessions = useCallback(() => {
    setSelectedEmptySessionKeys(emptyCellDialog.sessions.map((session) => session.key));
  }, [emptyCellDialog.sessions, setSelectedEmptySessionKeys]);

  const clearAllEmptySessions = useCallback(() => {
    setSelectedEmptySessionKeys([]);
  }, [setSelectedEmptySessionKeys]);

  const allEmptySessionsSelected = useMemo(() => {
    return emptyCellDialog.sessions.length > 0
      && selectedEmptySessionKeys.length === emptyCellDialog.sessions.length;
  }, [emptyCellDialog.sessions.length, selectedEmptySessionKeys.length]);

  const noEmptySessionsSelected = selectedEmptySessionKeys.length === 0;

  return {
    openEmptyCellDialog,
    closeEmptyCellDialog,
    handleConfirmEmptyCellDialog,
    handleGenerateWithBlankEmptyCells,
    toggleEmptySessionSelection,
    selectAllEmptySessions,
    clearAllEmptySessions,
    allEmptySessionsSelected,
    noEmptySessionsSelected,
  };
}