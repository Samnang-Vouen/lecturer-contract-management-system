import { useState } from 'react';
import {
  getContractPdfBlob,
  getContractPdfUrl,
  getAdvisorContractPdfBlob,
  getAdvisorContractPdfUrl,
  uploadContractSignature,
  updateContractStatus,
  createRedoRequest,           // ← add this import from contract.service
} from '../../services/contract.service';
import { uploadAdvisorContractSignature } from '../../services/advisorContract.service';

/**
 * Custom hook for contract actions (preview, download, approve, upload, redo)
 */
export const useContractActions = (fetchContracts) => {
  const [downloadingId, setDownloadingId] = useState(null);
  const [uploading, setUploading]         = useState(false);
  const [redoOpen, setRedoOpen]           = useState(false);
  const [redoContract, setRedoContract]   = useState(null);

  const toContractMeta = (contractOrId) => {
    if (contractOrId && typeof contractOrId === 'object') {
      return {
        id: contractOrId.id,
        type: String(contractOrId.contract_type || contractOrId.type || 'TEACHING').toUpperCase(),
      };
    }
    return { id: contractOrId, type: 'TEACHING' };
  };

  const previewPdf = (contractOrId) => {
    const { id, type } = toContractMeta(contractOrId);
    const url = type === 'ADVISOR' ? getAdvisorContractPdfUrl(id) : getContractPdfUrl(id);
    window.open(url, '_blank');
  };

  const downloadPdf = async (contractOrId, filename) => {
    const { id, type } = toContractMeta(contractOrId);
    try {
      setDownloadingId(id);
      const data = type === 'ADVISOR'
        ? await getAdvisorContractPdfBlob(id)
        : await getContractPdfBlob(id);
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `contract-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setDownloadingId(null);
    }
  };

  const approveAsManagement = async (contract) => {
    try {
      await updateContractStatus(contract.id, 'WAITING_LECTURER');
      await fetchContracts();
    } catch {}
  };

  const uploadManagementSignature = async (contractOrId, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { id, type } = toContractMeta(contractOrId);
      if (type === 'ADVISOR') {
        await uploadAdvisorContractSignature(id, file, 'management');
      } else {
        await uploadContractSignature(id, file, 'management');
      }
      await fetchContracts();
    } catch (e) {
      throw e;
    } finally {
      setUploading(false);
    }
  };

  // ── Redo ──────────────────────────────────────────────────────────────────
  const openRedoDialog = (contract) => {
    setRedoContract(contract);
    setRedoOpen(true);
  };

  const closeRedoDialog = () => {
    setRedoOpen(false);
    setRedoContract(null);
  };

  /** Submit redo request with a reason message */
  const requestRedo = async (contractId, message) => {
    try {
      await createRedoRequest(contractId, message);
      closeRedoDialog();
      await fetchContracts();
    } catch (e) {
      throw e; // let the dialog show a toast
    }
  };

  return {
    previewPdf,
    downloadPdf,
    approveAsManagement,
    uploadManagementSignature,
    downloadingId,
    uploading,
    // redo
    redoOpen,
    redoContract,
    openRedoDialog,
    closeRedoDialog,
    requestRedo,
  };
};