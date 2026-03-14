import { useState } from 'react';
import {
  getContractPdfBlob,
  getContractPdfUrl,
  getAdvisorContractPdfBlob,
  getAdvisorContractPdfUrl,
  uploadContractSignature,
  createRedoRequest,
} from '../../../services/contract.service';
import { uploadAdvisorContractSignature } from '../../../services/advisorContract.service';
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
  const [redoOpen, setRedoOpen] = useState(false);

  /**
   * Preview contract PDF in new tab
   */
  const previewPdf = (contractId, contract) => {
    const t = String(contract?.contract_type || '').toUpperCase();
    const url = t === 'ADVISOR' ? getAdvisorContractPdfUrl(contractId) : getContractPdfUrl(contractId);
    window.open(url, '_blank');
  };

  /**
   * Download contract PDF
   */
  const downloadPdf = async (contract) => {
    const id = typeof contract === 'object' ? contract?.id : contract;
    const t = typeof contract === 'object' ? String(contract?.contract_type || '').toUpperCase() : '';
    
    try {
      const blobData = t === 'ADVISOR' ? await getAdvisorContractPdfBlob(id) : await getContractPdfBlob(id);
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
      const url = t === 'ADVISOR' ? getAdvisorContractPdfUrl(id) : getContractPdfUrl(id);
      window.open(url, '_blank');
    }
  };

  /**
   * Upload signature for contract
   */
  const uploadSignature = async (contractId, file) => {
    if (!file) return;
    const t = String(selectedContract?.contract_type || '').toUpperCase();
    
    setUploading(true);
    try {
      if (t === 'ADVISOR') {
        await uploadAdvisorContractSignature(contractId, file, 'advisor');
      } else {
        await uploadContractSignature(contractId, file, 'lecturer');
      }
      await fetchContracts();
    } catch (e) {
      // Silent fail
    } finally {
      setUploading(false);
    }
  };

  /**
   * Open redo dialog for contract
   */
  const openRedoDialog = (contract) => {
    setSelectedContract(contract);
    setRedoOpen(true);
  };

  /**
   * Submit a redo request for the given contract id with a reason message.
   * Called after the lecturer fills in the redo reason dialog.
   */
  const requestRedo = async (contractId, message) => {
    try {
      await createRedoRequest(contractId, message);
      setRedoOpen(false);
      await fetchContracts();
    } catch (e) {
      // Propagate so the UI can show an error toast
      throw e;
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

  const openRedoDialog = (contract) => {
    setSelectedContract(contract);
    setRedoOpen(true);
  }

  return {
    uploading,
    selectedContract,
    setSelectedContract,
    viewOpen,
    setViewOpen,
    signOpen,
    setSignOpen,
    redoOpen,
    setRedoOpen,
    previewPdf,
    downloadPdf,
    uploadSignature,
    openViewDialog,
    openSignDialog,
    openRedoDialog,
    requestRedo,
  };
};
