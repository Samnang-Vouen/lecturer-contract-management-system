import { useState } from 'react';
import { getContractPdfBlob, getContractPdfUrl, uploadContractSignature, updateContractStatus } from '../../services/contract.service';

/**
 * Custom hook for contract actions (preview, download, approve, upload)
 */
export const useContractActions = (fetchContracts) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const previewPdf = (id) => {
    const url = getContractPdfUrl(id);
    window.open(url, '_blank');
  };

  const downloadPdf = async (id, filename) => {
    try {
      setDownloadingId(id);
      const data = await getContractPdfBlob(id);
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
      await updateContractStatus(contract.id, 'WAITING_LECTURER');
      await fetchContracts();
    } catch {}
  };

  const uploadManagementSignature = async (id, file) => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadContractSignature(id, file, 'management');
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
