import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import Button from '../../ui/Button';

export default function SyllabusUploadDialog({ 
  open, 
  onOpenChange, 
  onUpload, 
  uploading 
}) {
  const [syllabusFile, setSyllabusFile] = useState(null);

  const handleUpload = async () => {
    if (!syllabusFile) return;
    await onUpload({ syllabus: syllabusFile });
    onOpenChange(false);
    setSyllabusFile(null);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSyllabusFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-md sm:w-auto">
        <DialogHeader>
          <DialogTitle>Upload Course Syllabus</DialogTitle>
          <DialogDescription>
            Attach a PDF syllabus. This will be stored in your personal folder.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept="application/pdf"
              onChange={e => setSyllabusFile(e.target.files?.[0] || null)}
              className="block w-full text-sm"
            />
            {syllabusFile && (
              <p className="mt-2 text-xs text-gray-600">Selected: {syllabusFile.name}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="secondary" 
              type="button" 
              onClick={handleCancel} 
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={!syllabusFile || uploading}
              onClick={handleUpload}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
          <p className="text-[11px] text-gray-500">
            Accepted format: PDF only. Max size may be limited by server settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
