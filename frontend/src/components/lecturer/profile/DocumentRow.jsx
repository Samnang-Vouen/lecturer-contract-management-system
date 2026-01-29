import React from 'react';
import { buildFileUrl } from '../../../utils/profileUtils';

export default function DocumentRow({ label, exists, url, onUpload, uploading, editable }) {
  const downloadUrl = exists ? buildFileUrl(url) : null;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-sm p-4 rounded-xl border border-dashed border-gray-200 hover:border-gray-300 transition-colors bg-gradient-to-br from-white to-gray-50/70 group">
      <div className="w-full sm:w-auto">
        <p className="font-medium text-gray-800 flex items-center gap-2 tracking-wide">
          {exists ? (
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow" />
          ) : (
            <span className="inline-block w-2 h-2 rounded-full bg-gray-300 shadow-inner" />
          )}
          {label}
        </p>
        <p className={`text-[11px] mt-1 ${exists ? 'text-emerald-600 font-medium' : 'text-gray-400 italic'}`}>
          {exists ? 'Uploaded' : 'Not uploaded'}
        </p>
      </div>
      <div className="flex items-center flex-wrap gap-2">
        {exists && (
          <a
            href={downloadUrl}
            download
            className="text-xs bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-3 py-1.5 rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Download
          </a>
        )}
        {editable && (
          <label className="text-xs cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md font-medium shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500">
            <input 
              type="file" 
              className="hidden" 
              accept="application/pdf" 
              onChange={e => { 
                const f = e.target.files?.[0]; 
                if (f) onUpload(f); 
              }} 
              disabled={uploading} 
            />
            {uploading ? 'Uploading...' : 'Upload'}
          </label>
        )}
      </div>
    </div>
  );
}
