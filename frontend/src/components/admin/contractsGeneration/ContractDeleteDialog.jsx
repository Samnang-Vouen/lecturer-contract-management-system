import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import Button from '../../ui/Button';

/**
 * ContractDeleteDialog - Confirmation dialog for deleting contracts
 */
export default function ContractDeleteDialog({ 
  open, 
  onOpenChange, 
  contractId,
  contractLabel,
  onConfirm 
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    setBusy(true);
    
    const result = await onConfirm(contractId);
    
    setBusy(false);
    if (result.ok) {
      onOpenChange(false);
    } else {
      setError(result.message || 'Unable to delete this contract.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5">
          <DialogTitle className="text-left">Delete Contract</DialogTitle>
          <DialogDescription className="text-left mt-3">
            Do you want to delete this {contractLabel}?
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="px-6 -mt-1 text-sm text-red-600">{error}</div>
        )}
        
        <div className="px-6 py-5 flex justify-center gap-2 border-t">
          <Button
            className="min-w-[88px] bg-red-600 hover:bg-red-700 text-white"
            disabled={busy}
            onClick={handleConfirm}
          >
            {busy ? 'Deleting…' : 'OK'}
          </Button>
          <Button
            variant="outline"
            className="min-w-[88px]"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
