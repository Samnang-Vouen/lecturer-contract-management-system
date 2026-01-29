import React from 'react';

export default function OverviewItem({ label, value, dark }) {
  return (
    <div>
      <p className={`text-[10px] uppercase tracking-wide font-medium ${dark ? 'text-white/60' : 'text-gray-400'}`}>
        {label}
      </p>
      <div className={`text-sm font-medium mt-0.5 ${dark ? 'text-white' : 'text-gray-700'}`}>
        {value || '—'}
      </div>
    </div>
  );
}
