import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import AdvisorRedoForm from './redoEdit/AdvisorRedoForm';
import TeachingRedoForm from './redoEdit/TeachingRedoForm';
import { useContractRedoEditMappings } from '../../../hooks/admin/contractGeneration/useContractRedoEditMappings';
import { useContractRedoEditState } from '../../../hooks/admin/contractGeneration/useContractRedoEditState';
import { useContractRedoEditSubmit } from '../../../hooks/admin/contractGeneration/useContractRedoEditSubmit';

export default function ContractRedoEditDialog({
  open,
  onOpenChange,
  contract,
  onSave,
  currentAcademicYear,
  mappings,
  mappingsByYear,
  fetchMappingsForYear,
  mappingUserId,
}) {
  const state = useContractRedoEditState({ open, contract, currentAcademicYear });
  const mappingsState = useContractRedoEditMappings({
    open,
    advisor: state.advisor,
    contract,
    currentAcademicYear,
    mappings,
    mappingsByYear,
    fetchMappingsForYear,
    mappingUserId,
    contractLecturerId: state.contractLecturerId,
    teachAcademicYear: state.teachAcademicYear,
    courseQuery: state.courseQuery,
    didInitSelection: state.didInitSelection,
    setDidInitSelection: state.setDidInitSelection,
    setSelectedMappingIds: state.setSelectedMappingIds,
    setCombineByMapping: state.setCombineByMapping,
  });
  const submitState = useContractRedoEditSubmit({
    advisor: state.advisor,
    contract,
    onSave,
    onOpenChange,
    startDate: state.startDate,
    endDate: state.endDate,
    role: state.role,
    hourlyRate: state.hourlyRate,
    capstone1: state.capstone1,
    capstone2: state.capstone2,
    internship1: state.internship1,
    internship2: state.internship2,
    hoursPerStudent: state.hoursPerStudent,
    joinJudgingHours: state.joinJudgingHours,
    students: state.students,
    duties: state.duties,
    items: state.items,
    courses: state.courses,
    yearMappings: mappingsState.yearMappings,
    selectedMappingIds: state.selectedMappingIds,
    combineByMapping: state.combineByMapping,
    contractLecturerId: state.contractLecturerId,
    mappingUserId,
    canSelectFromMappings: mappingsState.canSelectFromMappings,
    effectiveTeachYear: mappingsState.effectiveTeachYear,
  });

  const formProps = {
    ...state,
    ...mappingsState,
    ...submitState,
    onOpenChange,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 my-4">
        <DialogHeader>
          <DialogTitle>Edit contract (Redo requested)</DialogTitle>
          <DialogDescription>
            Update the contract and resubmit it for signature.
          </DialogDescription>
        </DialogHeader>

        {submitState.submitError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-line">
            {submitState.submitError}
          </div>
        ) : null}

        {state.advisor ? (
          <AdvisorRedoForm {...formProps} />
        ) : (
          <TeachingRedoForm {...formProps} />
        )}
      </DialogContent>
    </Dialog>
  );
}
