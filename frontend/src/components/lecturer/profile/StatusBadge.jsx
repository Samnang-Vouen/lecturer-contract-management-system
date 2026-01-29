import React from 'react';

export default function StatusBadge({ status, dark }) {
  const isActive = status === 'active';
  const base = dark
    ? (isActive ? 'bg-emerald-400/25 text-emerald-100 ring-1 ring-emerald-300/40' : 'bg-white/15 text-white/70 ring-1 ring-white/20')
    : (isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600');
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium backdrop-blur ${base}`}>
      {status}
    </span>
  );
}
