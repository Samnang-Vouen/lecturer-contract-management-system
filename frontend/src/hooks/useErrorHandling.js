import { useState } from "react";

/**
 * Custom hook for managing error state and dialogs
 */
export function useErrorHandling() {
  const [error, setError] = useState("");
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  const showErrorPopup = (message) => {
    setError(message);
    setIsErrorDialogOpen(true);
  };

  const clearError = () => {
    setError("");
    setIsErrorDialogOpen(false);
  };

  return {
    error,
    setError,
    isErrorDialogOpen,
    setIsErrorDialogOpen,
    showErrorPopup,
    clearError,
  };
}
