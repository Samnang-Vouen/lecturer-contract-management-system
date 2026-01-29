import React from 'react';
import Button from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';

export default function DeleteMappingDialog({ open, onOpenChange, mapping, courseMap, onConfirm, deleting }) {
  if (!mapping) return null;

  const courseName = mapping?.course?.course_name || 
                    courseMap[mapping?.course_id]?.course_name || 
                    mapping?.course?.course_code || 
                    courseMap[mapping?.course_id]?.course_code || 
                    mapping?.course_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <div className="px-2 pb-2 text-center space-y-4">
          <p className="text-sm text-gray-700">
            Do you want to delete this {courseName}?
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-center">
            <Button
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white sm:min-w-[120px]"
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'OK'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="sm:min-w-[120px]"
              disabled={deleting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
