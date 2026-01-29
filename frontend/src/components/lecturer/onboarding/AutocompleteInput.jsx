import React, { useMemo } from 'react';
import Input from '../../ui/Input';

/**
 * Autocomplete input component with dropdown suggestions
 */
export default function AutocompleteInput({ 
  value, 
  onChange, 
  onSelect,
  suggestions = [], 
  placeholder, 
  label,
  required = false,
  className = ''
}) {
  // Check if there's an exact match to hide suggestions
  const hasExactMatch = useMemo(() => {
    const q = String(value || '').trim().toLowerCase();
    if (!q) return false;
    return suggestions.some(s => s.toLowerCase() === q);
  }, [value, suggestions]);

  const showSuggestions = suggestions.length > 0 && !hasExactMatch;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {required && (
            <>
              <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only"> required</span>
            </>
          )}
        </label>
      )}
      
      <div className="relative">
        <Input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full ${className}`}
        />
        
        {showSuggestions && (
          <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-44 overflow-auto">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => onSelect(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
