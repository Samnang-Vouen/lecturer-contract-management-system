import React, { useMemo } from 'react';
import { avatarColors } from '../../../utils/profileUtils';

export default function Avatar({ name }) {
  const initials = name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const color = useMemo(() => avatarColors[initials.charCodeAt(0) % avatarColors.length], [initials]);
  
  return (
    <div className="relative">
      <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 via-blue-500 to-emerald-500 rounded-full blur opacity-60 group-hover:opacity-90 transition" />
      <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white text-xl font-semibold shadow-lg ring-4 ring-white ${color}`}>
        {initials || 'L'}
      </div>
    </div>
  );
}
