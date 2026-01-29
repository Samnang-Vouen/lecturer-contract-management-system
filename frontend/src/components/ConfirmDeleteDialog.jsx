import React from "react";
import { Trash2, Loader2 } from "lucide-react";

/**
 * Reusable confirm delete dialog component
 */
export default function ConfirmDeleteDialog({ 
  open, 
  onOpenChange, 
  itemName, 
  onConfirm, 
  loading 
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-white/60 w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Deletion</h3>
          <p className="text-slate-600">
            Do you want to delete <strong className="text-slate-900">{itemName}</strong>?
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
