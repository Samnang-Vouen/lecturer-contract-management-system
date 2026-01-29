import React from 'react';

export default function SectionHeader({ title, icon, accent = 'indigo' }) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
    indigo: 'text-indigo-600 bg-indigo-50'
  };
  const styles = colorMap[accent] || colorMap.indigo;
  
  return (
    <div className="border-b px-6 pt-4 bg-gradient-to-r from-white via-gray-50 to-white relative">
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500/70 via-blue-500/60 to-emerald-500/70 rounded-tr-full rounded-br-full" />
      <h2 className="text-[13px] font-semibold text-gray-700 pb-3 flex items-center gap-2 tracking-wide">
        <span className={`h-7 w-7 rounded-full flex items-center justify-center ${styles} shadow-sm ring-1 ring-white`}>
          {icon}
        </span>
        <span>{title}</span>
      </h2>
    </div>
  );
}
