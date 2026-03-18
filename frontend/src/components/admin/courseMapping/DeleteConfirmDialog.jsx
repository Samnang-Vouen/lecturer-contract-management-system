import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

/**
 * DeleteConfirmDialog - Confirmation dialog for deleting a course mapping
 */
export default function DeleteConfirmDialog({ isOpen, onClose, mapping, courseMap, onConfirm, isDeleting }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !mapping) return null;

  const courseName =
    mapping?.course?.course_name ||
    courseMap[mapping?.course_id]?.course_name ||
    mapping?.course?.course_code ||
    courseMap[mapping?.course_id]?.course_code ||
    mapping?.course_id;

  const handleClose = () => {
    onClose(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!isDeleting) handleClose();
        }}
      />
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900">Delete Course Mapping</h3>
            <p className="text-slate-600">Are you sure you want to delete {courseName}? This action cannot be undone.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:shadow-xl disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
