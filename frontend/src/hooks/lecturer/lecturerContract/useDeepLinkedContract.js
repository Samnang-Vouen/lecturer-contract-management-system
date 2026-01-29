import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook for managing deep-linked contract
 * Handles ?open=ID URL parameter
 */
export const useDeepLinkedContract = (contracts, openViewDialog, openSignDialog) => {
  const [openId, setOpenId] = useState(null);

  // Read deep link parameter once
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = parseInt(params.get('open'), 10);
      if (Number.isInteger(id)) setOpenId(id);
    } catch {}
  }, []);

  // Find the deep-linked contract
  const openContract = useMemo(
    () => (contracts || []).find(c => c.id === openId),
    [contracts, openId]
  );

  // Auto-open contract when found
  useEffect(() => {
    if (openContract) {
      const canSign = 
        openContract.status === 'DRAFT' || 
        openContract.status === 'MANAGEMENT_SIGNED' || 
        openContract.status === 'WAITING_LECTURER';
      
      if (canSign) {
        openSignDialog(openContract);
      } else {
        openViewDialog(openContract);
      }
      
      setOpenId(null); // Prevent re-trigger
    }
  }, [openContract, openSignDialog, openViewDialog]);

  return { openId, setOpenId };
};
