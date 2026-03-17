import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Loader2 } from 'lucide-react';

export default function DeleteLecturerModal({ 
  isOpen, 
  lecturer, 
  onConfirm, 
  onCancel 
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !lecturer) return null;

  const handleCancel = () => {
    if (isDeleting) return;
    onCancel();
  };

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900">Delete Lecturer</h3>
            <p className="text-slate-600">
              Are you sure you want to delete {lecturer.email}? This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isDeleting}
              className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:shadow-xl disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
