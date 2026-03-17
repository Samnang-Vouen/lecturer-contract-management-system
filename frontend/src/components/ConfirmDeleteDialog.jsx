import React, { useEffect } from "react";
import { createPortal } from "react-dom";
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
  useEffect(() => {
    if (!open) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!loading) {
            onOpenChange(false);
          }
        }}
      />
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900">Confirm Deletion</h3>
            <p className="text-slate-600">
              Do you want to delete <strong className="text-slate-900">{itemName}</strong>?
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:shadow-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
