import React, { useEffect, useMemo, useState } from 'react';
import { useContractData } from '../../hooks/admin/contractGeneration/useContractData';
import { useContractMappings } from '../../hooks/admin/contractGeneration/useContractMappings';
import { useContractActions } from '../../hooks/admin/contractGeneration/useContractActions';
import { useAdvisorContractsAdmin } from '../../hooks/admin/contractGeneration/useAdvisorContractsAdmin';
import { useContractGenerationDerived } from '../../hooks/admin/contractGeneration/useContractGenerationDerived';
import { useContractGenerationHandlers } from '../../hooks/admin/contractGeneration/useContractGenerationHandlers';
import { useContractMenu } from '../../hooks/admin/contractGeneration/useContractMenu';
import ContractActionsMenu from '../../components/admin/contractsGeneration/ContractActionsMenu';
import ContractFilters from '../../components/admin/contractsGeneration/ContractFilters';
import ContractGenerationHeader from '../../components/admin/contractsGeneration/ContractGenerationHeader';
import ContractGenerationDialog from '../../components/admin/contractsGeneration/ContractGenerationDialog';
import ContractGridSection from '../../components/admin/contractsGeneration/ContractGridSection';
import ContractDeleteDialog from '../../components/admin/contractsGeneration/ContractDeleteDialog';
import ContractRedoEditDialog from '../../components/admin/contractsGeneration/ContractRedoEditDialog';
import { formatContractId } from '../../utils/contractHelpers';

export default function ContractGeneration() {
  const ACADEMIC_YEAR_STORAGE_KEY = 'contractGeneration.academicYear';
  const getDefaultAcademicYear = () => {
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
  };

  const [academicYear, setAcademicYear] = useState(() => {
    try {
      const saved = window?.localStorage?.getItem(ACADEMIC_YEAR_STORAGE_KEY);
      return saved || getDefaultAcademicYear();
    } catch {
      return getDefaultAcademicYear();
    }
  });
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, label: '' });
  const [advisorContracts, setAdvisorContracts] = useState([]);
  const [advisorTotal, setAdvisorTotal] = useState(0);
  const [_advisorLoading, setAdvisorLoading] = useState(false);
  const [editRedo, setEditRedo] = useState({ open: false, contract: null });

  useEffect(() => {
    try {
      window?.localStorage?.setItem(ACADEMIC_YEAR_STORAGE_KEY, academicYear);
    } catch {
      // ignore storage errors
    }
  }, [academicYear]);

  // Custom hooks
  const contractData = useContractData();
  const contractMappings = useContractMappings(academicYear);
  const contractsForActions = useMemo(
    () => [...(contractData.contracts || []), ...(advisorContracts || [])],
    [contractData.contracts, advisorContracts]
  );
  const contractActions = useContractActions(
    contractsForActions,
    contractData.setContracts,
    contractData.refreshContracts
  );
  const contractMenu = useContractMenu(contractData.contracts);
  const { fetchAllAdvisorContracts, refreshSingleAdvisorContract } = useAdvisorContractsAdmin({
    setAdvisorContracts,
    setAdvisorTotal,
    setAdvisorLoading,
  });
  const { totalBase, filteredContracts } = useContractGenerationDerived({
    contractData,
    contractMappings,
    advisorContracts,
  });
  const {
    handleCreateContract,
    handleCreateAdvisorContract,
    handleOpenRedoEdit,
    handleSaveRedoEdit,
  } = useContractGenerationHandlers({
    academicYear,
    contractActions,
    refreshSingleAdvisorContract,
    fetchAllAdvisorContracts,
    contractData,
    setEditRedo,
  });

  const openDeleteConfirm = (id) => {
    if (!id) return;
    const c = (contractData.contracts || []).find(x => x.id === id);
    const label = c ? formatContractId(c) : `#${id}`;
    setConfirmDelete({ open: true, id, label });
    contractMenu.closeMenu();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <ContractGenerationHeader onGenerate={() => setShowGenerateDialog(true)} />

      {/* Contract Generation Dialog */}
      <ContractGenerationDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        academicYear={academicYear}
        onAcademicYearChange={setAcademicYear}
        lecturers={contractMappings.lecturers}
        mappings={contractMappings.mappings}
        mappingUserId={contractMappings.mappingUserId}
        resolveLecturerUserId={contractMappings.resolveLecturerUserId}
        onCreate={handleCreateContract}
        onCreateAdvisor={handleCreateAdvisorContract}
      />

      {/* Redo edit dialog (REQUEST_REDO) */}
      <ContractRedoEditDialog
        open={editRedo.open}
        onOpenChange={(v) => setEditRedo(prev => ({ ...prev, open: v }))}
        contract={editRedo.contract}
        onSave={handleSaveRedoEdit}
        currentAcademicYear={academicYear}
        mappings={contractMappings.mappings}
        mappingsByYear={contractMappings.mappingsByYear}
        fetchMappingsForYear={contractMappings.fetchMappingsForYear}
        mappingUserId={contractMappings.mappingUserId}
      />

      {/* Search & filter bar */}
      <ContractFilters
        search={contractData.search}
        onSearchChange={contractData.setSearch}
        statusFilter={contractData.statusFilter}
        onStatusFilterChange={contractData.setStatusFilter}
      />

      <ContractGridSection filteredContracts={filteredContracts} totalBase={totalBase} contractData={contractData} contractActions={contractActions} handleOpenRedoEdit={handleOpenRedoEdit} />

      <ContractActionsMenu contractMenu={contractMenu} contractActions={contractActions} openDeleteConfirm={openDeleteConfirm} />

      {/* Delete confirmation dialog */}
      <ContractDeleteDialog
        open={confirmDelete.open}
        onOpenChange={(v) => setConfirmDelete(prev => ({ ...prev, open: v }))}
        contractId={confirmDelete.id}
        contractLabel={confirmDelete.label}
        onConfirm={contractActions.deleteContract}
      />
    </div>
  );
}