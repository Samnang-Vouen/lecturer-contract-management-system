import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

/**
 * Multi-select component for courses with search functionality
 */
export default function CourseMultiSelect({ options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const toggle = (course) => {
    const isSelected = selected.includes(course);
    if (isSelected) {
      onChange(selected.filter(c => c !== course));
      return;
    }
    onChange([...selected, course]);
  };

  const filtered = options.filter(o => 
    o.toLowerCase().includes(query.toLowerCase())
  );

  const buttonLabel = selected.length ? selected.join(', ') : 'Select courses';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[42px]"
        title={buttonLabel}
      >
        <span className="block truncate text-sm text-gray-700">{buttonLabel}</span>
      </button>
      
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg p-2 space-y-2">
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-gray-50 border border-gray-200">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search course..."
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
            {query && (
              <button 
                type="button" 
                onClick={() => setQuery('')} 
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="max-h-56 overflow-auto pr-1 space-y-1">
            {filtered.map(o => {
              const active = selected.includes(o);
              return (
                <button
                  type="button"
                  key={o}
                  onClick={() => toggle(o)}
                  className={`w-full text-left px-2 py-1 rounded text-xs md:text-sm transition-colors ${
                    active ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {o}
                  {active && <span className="ml-1">✓</span>}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-xs text-gray-500 px-2 py-2">No courses</div>
            )}
          </div>
          
          <div className="flex justify-between items-center px-1 pt-1 border-t border-gray-100">
            <span className="text-[11px] text-gray-500">{selected.length} selected</span>
            {selected.length > 0 && (
              <button 
                type="button" 
                onClick={() => onChange([])} 
                className="text-[11px] text-red-600 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
      
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map(c => (
            <span 
              key={c} 
              className="group inline-flex items-center bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-200"
            >
              {c}
              <button 
                type="button" 
                onClick={() => toggle(c)} 
                className="ml-1 text-blue-500 group-hover:text-blue-700 hover:scale-110 transition-transform"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
