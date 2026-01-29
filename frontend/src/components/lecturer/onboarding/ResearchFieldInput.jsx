import React, { useState, useMemo } from 'react';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

/**
 * Research field input with autocomplete suggestions
 */
export default function ResearchFieldInput({ 
  researchFields, 
  onAdd, 
  onRemove, 
  researchFieldsAPI 
}) {
  const [newResearchField, setNewResearchField] = useState('');

  // Suggestions computed from API research fields filtered by typed text
  const researchSuggestions = useMemo(() => {
    const q = String(newResearchField || '').trim().toLowerCase();
    if (!q) return [];
    
    return researchFieldsAPI
      .map(r => r.name)
      .filter(name => name.toLowerCase().includes(q) && !researchFields.includes(name))
      .slice(0, 8);
  }, [newResearchField, researchFields, researchFieldsAPI]);

  const handleAdd = () => {
    const value = String(newResearchField || '').trim();
    if (value) {
      onAdd(value);
      setNewResearchField('');
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    onAdd(suggestion);
    setNewResearchField('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">Research Fields</label>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={newResearchField}
            onChange={(e) => setNewResearchField(e.target.value)}
            placeholder="Enter research field"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          
          {researchSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-44 overflow-auto">
              {researchSuggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <Button 
          type="button" 
          onClick={handleAdd} 
          variant="outline"
          className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Add
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-3">
        {researchFields.map((field) => (
          <span
            key={field}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-600 border border-blue-200"
          >
            {field}
            <button
              type="button"
              onClick={() => onRemove(field)}
              className="ml-2 text-gray-600 hover:text-gray-800 w-4 h-4 rounded-full hover:bg-gray-200 flex items-center justify-center"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
