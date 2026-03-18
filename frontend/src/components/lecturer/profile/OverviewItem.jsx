import React from 'react';

export default function OverviewItem({ label, value, dark }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className={`text-[10px] uppercase tracking-[0.18em] font-semibold ${dark ? 'text-white/60' : 'text-slate-400'}`}>
        {label}
      </p>
      <div className={`text-sm font-semibold mt-1 ${dark ? 'text-white' : 'text-slate-700'}`}>
        {value || '—'}
      </div>
    </div>
  );
}
