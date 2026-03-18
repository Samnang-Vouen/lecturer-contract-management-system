import React from 'react';
import { UserCircle } from 'lucide-react';

export default function Avatar({ name }) {
  return (
    <div
      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 flex items-center justify-center shadow-sm mx-auto sm:mx-0"
      title={name || "Lecturer"}
      aria-label={name || "Lecturer avatar"}
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
        <UserCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
      </div>
    </div>
  );
}
