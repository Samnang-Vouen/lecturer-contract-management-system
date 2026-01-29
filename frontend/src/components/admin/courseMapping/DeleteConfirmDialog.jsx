import React from 'react';
import { Trash2 } from 'lucide-react';

/**
 * DeleteConfirmDialog - Confirmation dialog for deleting a course mapping
 */
export default function DeleteConfirmDialog({ isOpen, onClose, mapping, courseMap, onConfirm, isDeleting }) {
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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isDeleting) {
      handleClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-white/60 w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Course Mapping</h3>
          <p className="text-slate-600">Are you sure you want to delete {courseName}? This action cannot be undone.</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
  );
}
