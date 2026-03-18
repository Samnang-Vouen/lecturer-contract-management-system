import React, { useState } from 'react';
import ContractHeader from '../../components/management/contract/ContractHeader';
import ContractFilters from '../../components/management/contract/ContractFilters';
import PendingSignaturesAlert from '../../components/management/contract/PendingSignaturesAlert';
import ContractGrid from '../../components/management/contract/ContractGrid';
import UploadSignatureDialog from '../../components/management/contract/UploadSignatureDialog';
import ContractDetailDialog from '../../components/management/contract/ContractDetailDialog';
import ContractRedoDialog from '../../components/management/contract/ContractRedoDialog';  // ← new
import { useContracts } from '../../hooks/management/useContracts';
import { useContractActions } from '../../hooks/management/useContractActions';
import { useUploadDialog } from '../../hooks/management/useUploadDialog';

export default function ManagementContracts() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    contracts,
    filteredContracts,
    loading,
    page,
    setPage,
    q,
    setQ,
    status,
    setStatus,
    fetchContracts,
  } = useContracts();

  // ── Actions ───────────────────────────────────────────────────────────────
  const {
    previewPdf,
    downloadPdf,
    uploadManagementSignature,
    downloadingId,
    uploading,
    redoOpen,
    redoContract,
    openRedoDialog,
    closeRedoDialog,
    requestRedo,
  } = useContractActions(fetchContracts);

  // ── Upload signature dialog ───────────────────────────────────────────────
  const {
    showUploadDlg,
    setShowUploadDlg,
    uploadContract,
    selectedFile,
    setSelectedFile,
    uploadError,
    setUploadError,
    openUploadDialog,
    closeUploadDialog,
  } = useUploadDialog();

  // ── Detail dialog ─────────────────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailContract, setDetailContract] = useState(null);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSignClick = (contract) => openUploadDialog(contract);

  const handleFileChange = (e) => {
    setUploadError('');
    setSelectedFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadContract?.id) {
      setUploadError('Please choose an image.');
      return;
    }
    try {
      await uploadManagementSignature(uploadContract, selectedFile);
      closeUploadDialog();
    } catch {
      setUploadError('Failed to upload. Please try again.');
    }
  };

  const handleShowDetail = (contract) => {
    setDetailContract(contract);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="p-8 space-y-6">
        <ContractHeader />

        <ContractFilters
          q={q}
          setQ={setQ}
          status={status}
          setStatus={setStatus}
          setPage={setPage}
        />

        <PendingSignaturesAlert
          contracts={contracts}
          onPreview={previewPdf}
          onSign={handleSignClick}
          onRedo={openRedoDialog}      
          uploading={uploading}
        />

        <ContractGrid
          contracts={filteredContracts}
          onPreview={previewPdf}
          onDownload={downloadPdf}
          onSign={handleSignClick}
          onShowDetail={handleShowDetail}
          downloadingId={downloadingId}
        />

        <UploadSignatureDialog
          open={showUploadDlg}
          onOpenChange={setShowUploadDlg}
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          uploadError={uploadError}
          uploading={uploading}
          onUpload={handleUpload}
        />

        <ContractDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          contract={detailContract}
        />

        {/* Redo request dialog — same component reused from lecturer side */}
        <ContractRedoDialog
          isOpen={redoOpen}
          onClose={closeRedoDialog}
          contract={redoContract}
                 
        />
      </div>
    </div>
  );
}