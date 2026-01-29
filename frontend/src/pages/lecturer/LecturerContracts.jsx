import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import LecturerContractsHeader from '../../components/lecturer/lecturerContract/LecturerContractsHeader';
import PendingContractsCard from '../../components/lecturer/lecturerContract/PendingContractsCard';
import ContractsListCard from '../../components/lecturer/lecturerContract/ContractsListCard';
import ContractViewDialog from '../../components/lecturer/lecturerContract/ContractViewDialog';
import ContractSignDialog from '../../components/lecturer/lecturerContract/ContractSignDialog';
import { useContractData } from '../../hooks/lecturer/lecturerContract/useContractData';
import { useContractActions } from '../../hooks/lecturer/lecturerContract/useContractActions';
import { useDeepLinkedContract } from '../../hooks/lecturer/lecturerContract/useDeepLinkedContract';

export default function LecturerContracts() {
  const { authUser } = useAuthStore();

  // Custom hooks for data management
  const {
    contracts,
    loading,
    total,
    statusFilter,
    setStatusFilter,
    hourlyRate,
    lecturerProfile,
    pendingContracts,
    filteredContracts,
    fetchContracts,
  } = useContractData();

  // Custom hooks for contract actions
  const {
    uploading,
    selectedContract,
    viewOpen,
    setViewOpen,
    signOpen,
    setSignOpen,
    previewPdf,
    downloadPdf,
    uploadSignature,
    openViewDialog,
    openSignDialog,
  } = useContractActions(lecturerProfile, authUser, fetchContracts);

  // Handle deep-linked contracts
  useDeepLinkedContract(filteredContracts, openViewDialog, openSignDialog);

  return (
    <div className='p-4 md:p-6 space-y-6'>
      {/* Page header */}
      <LecturerContractsHeader />

      {/* Pending contracts card */}
      <PendingContractsCard
        pendingContracts={pendingContracts}
        hourlyRate={hourlyRate}
        onPreview={previewPdf}
        onSign={openSignDialog}
      />

      {/* All contracts card */}
      <ContractsListCard
        contracts={contracts}
        filteredContracts={filteredContracts}
        total={total}
        loading={loading}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        hourlyRate={hourlyRate}
        lecturerProfile={lecturerProfile}
        authUser={authUser}
        onPreview={previewPdf}
        onDownload={downloadPdf}
        onViewDetail={openViewDialog}
        onSign={openSignDialog}
      />

      {/* View Contract Dialog */}
      <ContractViewDialog
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        contract={selectedContract}
        hourlyRate={hourlyRate}
      />

      {/* Signing Dialog */}
      <ContractSignDialog
        isOpen={signOpen}
        onClose={() => setSignOpen(false)}
        contract={selectedContract}
        uploading={uploading}
        onUploadSignature={uploadSignature}
      />
    </div>
  );
}
