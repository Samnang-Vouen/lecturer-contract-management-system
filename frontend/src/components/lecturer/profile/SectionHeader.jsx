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
    <div className="px-6 sm:px-8 py-4 border-b border-slate-100 bg-white">
      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
        <span className={`h-10 w-10 rounded-lg flex items-center justify-center ${styles}`}>
          {icon}
        </span>
        <span>{title}</span>
      </h2>
    </div>
  );
}
