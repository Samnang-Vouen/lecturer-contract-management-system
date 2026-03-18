import React from 'react';

export default function StatusBadge({ status, dark }) {
  const isActive = status === 'active';
  const base = dark
    ? (isActive ? 'bg-emerald-400/25 text-emerald-100 ring-1 ring-emerald-300/40' : 'bg-white/15 text-white/70 ring-1 ring-white/20')
    : (isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600');
  
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur ${base}`}>
      {status}
    </span>
  );
}
