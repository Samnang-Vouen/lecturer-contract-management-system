import { useState } from 'react';
import { 
  getContractPdfBlob, 
  getContractPdfUrl, 
  uploadContractSignature 
} from '../../../services/contract.service';
import { makePdfFilenameForContract } from '../../../utils/lecturerContractHelpers';

/**
 * Custom hook for contract actions
 * Handles preview, download, and signing operations
 */
export const useContractActions = (lecturerProfile, authUser, fetchContracts) => {
  const [uploading, setUploading] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);

  /**
   * Preview contract PDF in new tab
   */
  const previewPdf = (contractId) => {
    const url = getContractPdfUrl(contractId);
    window.open(url, '_blank');
  };

  /**
   * Download contract PDF
   */
  const downloadPdf = async (contract) => {
    const id = typeof contract === 'object' ? contract?.id : contract;
    
    try {
      const blobData = await getContractPdfBlob(id);
      const blob = new Blob([blobData], { type: 'application/pdf' });
      
      const filename = makePdfFilenameForContract(
        typeof contract === 'object' ? contract : null,
        lecturerProfile,
        authUser
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback: open in new tab
      const url = getContractPdfUrl(id);
      window.open(url, '_blank');
    }
  };

  /**
   * Upload signature for contract
   */
  const uploadSignature = async (contractId, file) => {
    if (!file) return;
    
    setUploading(true);
    try {
      await uploadContractSignature(contractId, file, 'lecturer');
      await fetchContracts();
    } catch (e) {
      // Silent fail
    } finally {
      setUploading(false);
    }
  };

  /**
   * Open view dialog for contract
   */
  const openViewDialog = (contract) => {
    setSelectedContract(contract);
    setViewOpen(true);
  };

  /**
   * Open sign dialog for contract
   */
  const openSignDialog = (contract) => {
    setSelectedContract(contract);
    setSignOpen(true);
  };

  return {
    uploading,
    selectedContract,
    setSelectedContract,
    viewOpen,
    setViewOpen,
    signOpen,
    setSignOpen,
    previewPdf,
    downloadPdf,
    uploadSignature,
    openViewDialog,
    openSignDialog,
  };
};
