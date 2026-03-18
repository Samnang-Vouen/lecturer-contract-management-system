import React from 'react';
import Label from '../../ui/Label';

export default function ReadOnlyField({ label, value }) {
  return (
    <div className="space-y-2 group">
      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        {label}
        {value && (
          <span className="text-[10px] uppercase tracking-wide text-indigo-500/70 font-semibold">
            Read only
          </span>
        )}
      </Label>
      <div className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 min-h-[46px] flex items-center font-medium text-slate-700 transition-colors select-text break-words">
        {value || '—'}
      </div>
    </div>
  );
}
