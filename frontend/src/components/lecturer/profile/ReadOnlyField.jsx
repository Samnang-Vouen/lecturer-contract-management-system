import React from 'react';
import Label from '../../ui/Label';

export default function ReadOnlyField({ label, value }) {
  return (
    <div className="space-y-1 group">
      <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
        {label}
        {value && (
          <span className="text-[9px] uppercase tracking-wide text-indigo-500/70 font-semibold">
            Read only
          </span>
        )}
      </Label>
      <div className="text-sm bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg px-2.5 py-1.5 min-h-[42px] flex items-center font-medium text-gray-700 group-hover:border-gray-300 transition-colors select-text shadow-inner break-words">
        {value || '—'}
      </div>
    </div>
  );
}
