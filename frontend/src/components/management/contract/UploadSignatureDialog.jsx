import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import Button from '../../ui/Button';

/**
 * Dialog for uploading management signature
 */
export default function UploadSignatureDialog({ 
  open, 
  onOpenChange, 
  selectedFile, 
  onFileChange, 
  uploadError, 
  uploading, 
  onUpload 
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Management Signature</DialogTitle>
          <DialogDescription>Choose an image file to sign this contract.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className={`rounded-md border ${selectedFile ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'} p-3`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Signature photo (PNG/JPG)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
            />
            {selectedFile && (
              <div className="mt-2 text-xs text-gray-600">
                Selected: {selectedFile.name} ({Math.round((selectedFile.size || 0) / 1024)} KB)
              </div>
            )}
            {uploadError && (
              <div className="mt-2 text-sm text-red-600">{uploadError}</div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              className="cursor-pointer" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              disabled={!selectedFile || uploading}
              onClick={onUpload}
            >
              {uploading ? 'Uploading…' : 'Upload & Sign'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
