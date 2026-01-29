import { useState } from 'react';

/**
 * Custom hook to manage upload signature dialog state
 */
export const useUploadDialog = () => {
  const [showUploadDlg, setShowUploadDlg] = useState(false);
  const [uploadContractId, setUploadContractId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const openUploadDialog = (contractId) => {
    setUploadContractId(contractId);
    setSelectedFile(null);
    setUploadError('');
    setShowUploadDlg(true);
  };

  const closeUploadDialog = () => {
    setShowUploadDlg(false);
    setSelectedFile(null);
    setUploadError('');
  };

  const resetUploadDialog = () => {
    setSelectedFile(null);
    setUploadError('');
  };

  return {
    showUploadDlg,
    setShowUploadDlg,
    uploadContractId,
    selectedFile,
    setSelectedFile,
    uploadError,
    setUploadError,
    openUploadDialog,
    closeUploadDialog,
    resetUploadDialog
  };
};
