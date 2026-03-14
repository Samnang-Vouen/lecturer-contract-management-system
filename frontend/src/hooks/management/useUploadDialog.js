import { useState } from 'react';

/**
 * Custom hook to manage upload signature dialog state
 */
export const useUploadDialog = () => {
  const [showUploadDlg, setShowUploadDlg] = useState(false);
  const [uploadContract, setUploadContract] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const openUploadDialog = (contract) => {
    setUploadContract(contract || null);
    setSelectedFile(null);
    setUploadError('');
    setShowUploadDlg(true);
  };

  const closeUploadDialog = () => {
    setShowUploadDlg(false);
    setUploadContract(null);
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
    uploadContract,
    selectedFile,
    setSelectedFile,
    uploadError,
    setUploadError,
    openUploadDialog,
    closeUploadDialog,
    resetUploadDialog
  };
};
