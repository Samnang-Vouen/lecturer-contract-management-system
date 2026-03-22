import React from 'react';
import { Eye, Download, FilePen, MessageSquare } from 'lucide-react';
import { getManagementStatusLabel, hasManagementRedoMessage } from '../../../utils/contractUtils';

/**
 * Contract card footer with status badge and action buttons
 */
export default function ContractCardFooter({ 
  contract, 
  onSign,
  onRedo,
  onViewRedoMessage,
  onPreview,
  onDownload,
  onShowDetail,
  isDownloading
}) {
  const status = getManagementStatusLabel(contract);
  const canRedo = String(contract?.status || '').trim().toUpperCase().replace(/\s+/g, '_') === 'WAITING_MANAGEMENT';
  const hasRedoRequest = hasManagementRedoMessage(contract);

  return (
    <div className="mt-4 pt-3.5 border-t border-gray-200 flex items-center justify-between">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium leading-none border ${status.class || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {status.icon ? React.createElement(status.icon, { className: 'w-3.5 h-3.5' }) : null}
        {status.label}
      </span>
      
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(contract);
          }}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all duration-200"
          title="View contract"
        >
          <Eye className="w-4 h-4" />
        </button>
        {canRedo ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRedo(contract);
            }}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all duration-200"
            title="Request redo"
          >
            <FilePen className="w-4 h-4" />
          </button>
        ) : null}
        {hasRedoRequest ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewRedoMessage(contract);
            }}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all duration-200"
            title="View redo message"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        ) : null}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
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
