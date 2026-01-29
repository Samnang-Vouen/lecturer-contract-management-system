import React from 'react';
import { PenTool, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import Button from '../../ui/Button';

/**
 * ContractSignDialog Component
 * Dialog for signing contracts
 */
export default function ContractSignDialog({ 
  isOpen, 
  onClose, 
  contract,
  uploading,
  onUploadSignature
}) {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && contract) {
      await onUploadSignature(contract.id, file);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5">
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="w-4 h-4" /> Sign Contract
          </DialogTitle>
          <DialogDescription>
            Provide your digital signature to accept this contract
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-6 pt-2 space-y-4">
          <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-800">
            By signing this contract, you agree to all terms and conditions outlined 
            in the document.
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="h-10 px-4 min-w-[160px]"
            >
              Cancel
            </Button>
            
            <label className={`inline-flex items-center gap-2 ${uploading ? 'opacity-70' : 'cursor-pointer'}`}>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
                disabled={uploading} 
              />
              <span className="h-10 px-4 min-w-[160px] border rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center">
                {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Upload Signature
              </span>
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
