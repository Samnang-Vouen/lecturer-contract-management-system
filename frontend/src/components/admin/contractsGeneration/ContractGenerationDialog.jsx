import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/Tabs';
import GenerationAcademicYearField from './generation/GenerationAcademicYearField';
import GenerationDialogActions from './generation/GenerationDialogActions';
import LecturerGenerationTab from './generation/LecturerGenerationTab';
import AdvisorGenerationTab from './generation/AdvisorGenerationTab';
import { useContractGenerationLecturer } from '../../../hooks/admin/contractGeneration/useContractGenerationLecturer';
import { useContractGenerationAdvisor } from '../../../hooks/admin/contractGeneration/useContractGenerationAdvisor';

/**
 * ContractGenerationDialog - Dialog for creating new contracts
 */
export default function ContractGenerationDialog({
  open,
  onOpenChange,
  academicYear,
  onAcademicYearChange,
  lecturers,
  mappings,
  mappingUserId,
  resolveLecturerUserId,
  onCreate,
  onCreateAdvisor
}) {
  const [dlgContractType, setDlgContractType] = useState('LECTURER');
  const lecturerForm = useContractGenerationLecturer({ mappings, mappingUserId, resolveLecturerUserId, onCreate, onOpenChange });
  const advisorForm = useContractGenerationAdvisor({ open, dlgContractType, resolveLecturerUserId, onCreateAdvisor, onOpenChange });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5">
          <DialogTitle>Generate New Contract</DialogTitle>
          <DialogDescription>Fill in the details below to generate a new contract.</DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-6 pt-2 max-h-[70vh] overflow-y-auto">
          {(dlgContractType === 'LECTURER' ? lecturerForm.dlgErrors.form : advisorForm.advErrors.form) && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
              {dlgContractType === 'LECTURER' ? lecturerForm.dlgErrors.form : advisorForm.advErrors.form}
            </div>
          )}

          <GenerationAcademicYearField academicYear={academicYear} onAcademicYearChange={onAcademicYearChange} />

          <Tabs value={dlgContractType} onValueChange={(v) => {
            setDlgContractType(v);
            lecturerForm.setDlgErrors({});
            advisorForm.setAdvErrors({});
          }}>
            <TabsList ariaLabel="Contract type">
              <TabsTrigger value="LECTURER">Lecturer</TabsTrigger>
              <TabsTrigger value="ADVISOR">Advisor</TabsTrigger>
            </TabsList>

            <TabsContent value="LECTURER">
              <LecturerGenerationTab {...lecturerForm} lecturers={lecturers} academicYear={academicYear} />
            </TabsContent>

            <TabsContent value="ADVISOR">
              <AdvisorGenerationTab {...advisorForm} lecturers={lecturers} />
            </TabsContent>
          </Tabs>
        </div>

        <GenerationDialogActions onOpenChange={onOpenChange} onSubmit={dlgContractType === 'LECTURER' ? lecturerForm.handleCreateLecturer : advisorForm.handleCreateAdvisor} />
      </DialogContent>
    </Dialog>
  );
}
