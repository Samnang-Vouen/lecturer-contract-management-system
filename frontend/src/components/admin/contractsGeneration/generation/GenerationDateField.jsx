import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import Input from '../../../ui/Input';

export default function GenerationDateField({ label, value, onChange, min, error }) {
  const inputRef = useRef(null);
  return (
    <div className="space-y-1 mb-4">
      <label className="block text-sm font-medium">{label} <span className="text-red-600">*</span></label>
      <div className="relative group">
        <Input ref={inputRef} className="w-full cursor-pointer h-11 text-base pr-10 shadow-sm sm:min-w-[220px]" type="date" value={value} min={min} onChange={(e) => onChange(e.target.value)} />
        <button
          type="button"
          aria-label={`Pick ${label.toLowerCase()}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
          onClick={() => {
            try { inputRef.current?.showPicker?.(); } catch { inputRef.current?.focus?.(); }
          }}
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}