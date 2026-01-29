import React from 'react';
import { XCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function RejectCandidateModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  candidate,
  reason,
  onReasonChange
}) {
  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-white/60 w-full max-w-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
            <XCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Reject Candidate</h3>
            <p className="text-slate-600 text-sm mt-1">{candidate.fullName}</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
              <span>Rejection Reason *</span>
              <span className="text-xs text-slate-500">
                {reason.length}/250
              </span>
            </label>
            <textarea
              rows={6}
              value={reason}
              onChange={(e) => {
                if (e.target.value.length <= 250) {
                  onReasonChange(e.target.value);
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all duration-200 bg-white resize-none"
              placeholder="Enter the reason for rejecting this candidate..."
              maxLength={250}
            />
          </div>
        </div>
        
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting || !reason.trim()}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? <LoadingSpinner /> : <XCircle className="w-5 h-5" />}
            {isSubmitting ? 'Processing...' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
