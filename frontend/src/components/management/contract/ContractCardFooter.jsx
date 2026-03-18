import React from 'react';
import { Eye, Download, FilePen } from 'lucide-react';
import { getStatusLabel } from '../../../utils/contractUtils';

/**
 * Statuses where redo is NOT allowed:
 * - COMPLETED        : both parties already signed
 * - CONTRACT_ENDED   : contract has expired
 * - WAITING_MANAGEMENT / WAITING_ADVISOR : redo request already in flight
 *   or management hasn't signed yet (nothing to redo from lecturer side)
 *
 * Redo IS allowed when:
 * - WAITING_LECTURER / MANAGEMENT_SIGNED : management signed, now waiting for
 *   lecturer — this is the window where lecturer can request changes
 */
const REDO_ALLOWED_STATUSES = new Set(['WAITING_LECTURER', 'MANAGEMENT_SIGNED']);

export default function ContractCardFooter({
  contract,
  onSign,
  onPreview,
  onDownload,
  onShowDetail,
  onRedo,
  isDownloading,
}) {
  const status = getStatusLabel(contract.status);

  const st = String(contract?.status || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

  const canRedo = REDO_ALLOWED_STATUSES.has(st) && typeof onRedo === 'function';

  return (
    <div className="mt-4 pt-3.5 border-t border-gray-200 flex items-center justify-between">
      {/* Status badge */}
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium leading-none border ${
          status.class || 'bg-gray-50 text-gray-700 border-gray-200'
        }`}
      >
        {status.icon ? React.createElement(status.icon, { className: 'w-3.5 h-3.5' }) : null}
        {status.label}
      </span>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Preview */}
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(contract); }}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all duration-200"
          title="View contract"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Request Redo — only when management has signed but lecturer hasn't yet */}
        {canRedo && (
          <button
            onClick={(e) => { e.stopPropagation(); onRedo(contract); }}
            className="p-2 rounded-lg bg-white border border-orange-300 hover:bg-orange-50 text-orange-600 transition-all duration-200"
            title="Request redo"
          >
            <FilePen className="w-4 h-4" />
          </button>
        )}

        {/* Download */}
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          disabled={isDownloading}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download PDF"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}