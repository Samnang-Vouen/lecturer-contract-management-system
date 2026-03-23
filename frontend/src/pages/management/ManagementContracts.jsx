import React, { useState } from 'react';
import ContractHeader from '../../components/management/contract/ContractHeader';
import ContractFilters from '../../components/management/contract/ContractFilters';
import PendingSignaturesAlert from '../../components/management/contract/PendingSignaturesAlert';
import ContractGrid from '../../components/management/contract/ContractGrid';
import UploadSignatureDialog from '../../components/management/contract/UploadSignatureDialog';
import ContractDetailDialog from '../../components/management/contract/ContractDetailDialog';
import ContractRedoDialog from '../../components/management/contract/ContractRedoDialog';
import ContractRedoMessageDialog from '../../components/management/contract/ContractRedoMessageDialog';
import { useContracts } from '../../hooks/management/useContracts';
import { useContractActions } from '../../hooks/management/useContractActions';
import { useUploadDialog } from '../../hooks/management/useUploadDialog';
import { hasManagementRedoMessage } from '../../utils/contractUtils';

export default function ManagementContracts() {
  // Custom hooks
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
    fetchContracts
  } = useContracts();

  const {
    previewPdf,
    downloadPdf,
    requestRedoAsManagement,
    uploadManagementSignature,
    downloadingId,
    uploading
  } = useContractActions(fetchContracts);

  const {
    showUploadDlg,
    setShowUploadDlg,
    uploadContract,
    selectedFile,
    setSelectedFile,
    uploadError,
    setUploadError,
    openUploadDialog,
    closeUploadDialog
  } = useUploadDialog();

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailContract, setDetailContract] = useState(null);
  const [redoOpen, setRedoOpen] = useState(false);
  const [redoContract, setRedoContract] = useState(null);
  const [redoMessageOpen, setRedoMessageOpen] = useState(false);
  const [redoMessageContract, setRedoMessageContract] = useState(null);

  // Handlers
  const handleSignClick = (contract) => {
    openUploadDialog(contract);
  };

  const handleFileChange = (e) => {
    setUploadError('');
    const file = e.target.files?.[0] || null;
    setSelectedFile(file || null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadContract?.id) {
      setUploadError('Please choose an image.');
      return;
    }
    try {
      await uploadManagementSignature(uploadContract, selectedFile);
      closeUploadDialog();
    } catch (e) {
      setUploadError('Failed to upload. Please try again.');
    }
  };

  const handleShowDetail = (contract) => {
    setDetailContract(contract);
    setDetailOpen(true);
  };

  const handleOpenRedo = (contract) => {
    setRedoContract(contract);
    setRedoOpen(true);
  };

  const handleOpenRedoMessage = (contract) => {
    if (!hasManagementRedoMessage(contract)) {
      return;
    }

    setRedoMessageContract(contract);
    setRedoMessageOpen(true);
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
          onRedo={handleOpenRedo}
          onSign={handleSignClick}
          uploading={uploading}
        />

        <ContractGrid 
          contracts={filteredContracts} 
          onPreview={previewPdf} 
          onDownload={downloadPdf} 
          onSign={handleSignClick} 
          onRedo={handleOpenRedo}
          onViewRedoMessage={handleOpenRedoMessage}
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

        <ContractRedoDialog
          open={redoOpen}
          onOpenChange={setRedoOpen}
          contract={redoContract}
          onSubmit={requestRedoAsManagement}
        />

        <ContractRedoMessageDialog
          open={redoMessageOpen}
          onOpenChange={setRedoMessageOpen}
          contract={redoMessageContract}
        />
      </div>
    </div>
  );
}
