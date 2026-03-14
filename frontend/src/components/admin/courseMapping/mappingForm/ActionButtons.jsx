import React from 'react';
import Button from '../../../ui/Button.jsx';

export default function ActionButtons({ isEditMode, onClose, onSubmit }) {
  return (
    <div className="col-span-1 sm:col-span-2 flex gap-2">
      <Button onClick={onClose} variant="outline" className="w-full sm:w-auto sm:flex-1">
        Cancel
      </Button>
      <Button onClick={onSubmit} className="w-full sm:w-auto sm:flex-1 bg-blue-600 text-white">
        {isEditMode ? 'Save' : 'Create'}
      </Button>
    </div>
  );
}
