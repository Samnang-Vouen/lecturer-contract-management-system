import React from 'react';
import Button from '../../../ui/Button';

export default function RedoEditDialogActions({ onCancel, onSubmit, canSubmit, saving }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 pt-2">
      <Button className="w-full sm:w-auto" variant="secondary" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
      <Button className="w-full sm:w-auto" onClick={onSubmit} disabled={!canSubmit}>
        Save & resend
      </Button>
    </div>
  );
}