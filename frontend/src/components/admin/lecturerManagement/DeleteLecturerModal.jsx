import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import Button from '../../ui/Button';

export default function DeleteLecturerModal({ 
  isOpen, 
  lecturer, 
  onConfirm, 
  onCancel 
}) {
  if (!isOpen || !lecturer) return null;

  return ReactDOM.createPortal(
    <div className='fixed inset-0 z-50'>
      <div className='absolute inset-0 bg-black/50' onClick={onCancel} />
      <div className='relative w-full h-full flex items-center justify-center p-4 pointer-events-none'>
        <div className='bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-5 pointer-events-auto'>
          <div className='flex items-start justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>Confirm Delete</h2>
            <button onClick={onCancel} className='text-gray-400 hover:text-gray-600'>
              <X className='w-5 h-5'/>
            </button>
          </div>
          
          <p className='text-sm text-gray-600'>
            Delete lecturer <span className='font-medium'>{lecturer.email}</span>? 
            This cannot be undone.
          </p>
          
          <div className='flex gap-3 pt-2'>
            <Button 
              onClick={onConfirm} 
              className='flex-1 bg-red-600 hover:bg-red-700'
            >
              OK
            </Button>
            <Button 
              variant='outline' 
              onClick={onCancel} 
              className='flex-1'
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
