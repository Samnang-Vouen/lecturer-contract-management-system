import { useState } from 'react';
import {
  getContractPdfBlob,
  getContractPdfUrl,
  getAdvisorContractPdfBlob,
  getAdvisorContractPdfUrl,
  uploadContractSignature,
  updateContractStatus,
} from '../../services/contract.service';
import { uploadAdvisorContractSignature } from '../../services/advisorContract.service';

/**
 * Custom hook for contract actions (preview, download, approve, upload)
 */
export const useContractActions = (fetchContracts) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [uploading, setUploading] = useState(false);

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
      const data = type === 'ADVISOR' ? await getAdvisorContractPdfBlob(id) : await getContractPdfBlob(id);
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `contract-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // optionally handle error (toast/log)
    } finally {
      setDownloadingId(null);
    }
  };

  const approveAsManagement = async (contract) => {
    try {
      // Teaching contracts only; advisor contracts have a separate lifecycle.
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

  return {
    previewPdf,
    downloadPdf,
    approveAsManagement,
    uploadManagementSignature,
    downloading,
    downloadingId,
    uploading
  };
};
