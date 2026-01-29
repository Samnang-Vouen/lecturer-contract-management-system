import React from 'react';
import { Eye, Download } from 'lucide-react';
import { getStatusLabel } from '../../../utils/contractUtils';

/**
 * Contract card footer with status badge and action buttons
 */
export default function ContractCardFooter({ 
  contract, 
  onSign,
  onPreview,
  onDownload,
  onShowDetail,
  isDownloading
}) {
  const status = getStatusLabel(contract.status);

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
            onPreview(contract.id);
          }}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all duration-200"
          title="View contract"
        >
          <Eye className="w-4 h-4" />
        </button>
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
