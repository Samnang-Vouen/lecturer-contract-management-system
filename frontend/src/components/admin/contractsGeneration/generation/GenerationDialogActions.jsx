import React from 'react';
import Button from '../../../ui/Button';

export default function GenerationDialogActions({ onOpenChange, onSubmit }) {
  return (
    <div className="px-6 py-4 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
      <Button variant="outline" className="w-full sm:w-auto cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
      <Button className="w-full sm:w-auto cursor-pointer" onClick={onSubmit}>Generate Contract</Button>
    </div>
  );
}