import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import Button from '../../ui/Button';

export default function SyllabusUploadDialog({ 
  open, 
  onOpenChange, 
  onUpload, 
  uploading 
}) {
  const [syllabusFiles, setSyllabusFiles] = useState([]);

  const handleUpload = async () => {
    if (!syllabusFiles.length) return;
    await onUpload({ syllabus: syllabusFiles });
    onOpenChange(false);
    setSyllabusFiles([]);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSyllabusFiles([]);
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
              multiple
              onChange={e => setSyllabusFiles(Array.from(e.target.files || []))}
              className="block w-full text-sm"
            />
            {syllabusFiles.length ? (
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p>Selected: {syllabusFiles.length} file(s)</p>
                <ul className="list-disc pl-5">
                  {syllabusFiles.slice(0, 5).map((f) => (
                    <li key={f.name}>{f.name}</li>
                  ))}
                  {syllabusFiles.length > 5 ? <li>and {syllabusFiles.length - 5} more…</li> : null}
                </ul>
              </div>
            ) : null}
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
              disabled={!syllabusFiles.length || uploading}
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
