import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Input from '../../../ui/Input';

export default function GenerationEditableList({
  label,
  placeholder,
  inputValue,
  setInputValue,
  items,
  setItems,
  editingIdx,
  setEditingIdx,
  editingValue,
  setEditingValue,
  error,
}) {
  return (
    <div className="space-y-2 mb-4">
      <label className="block text-sm font-medium">{label} <span className="text-red-600">*</span></label>
      <Input
        className="w-full cursor-pointer"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          const value = String(inputValue || '').trim();
          if (!value) return;
          setItems((prev) => [...prev, value]);
          setInputValue('');
        }}
        placeholder={placeholder}
      />
      {items.length > 0 ? (
        <div className="space-y-1 text-sm">
          {items.map((item, idx) => {
            const isEditing = editingIdx === idx;
            return (
              <div key={`${item}-${idx}`} className="flex items-center gap-2">
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      className="w-full"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const next = String(editingValue || '').trim();
                          if (next) setItems((prev) => prev.map((value, itemIdx) => (itemIdx === idx ? next : value)));
                          setEditingIdx(null);
                          setEditingValue('');
                        } else if (e.key === 'Escape') {
                          setEditingIdx(null);
                          setEditingValue('');
                        }
                      }}
                    />
                  ) : <div className="text-xs text-gray-600">{item}</div>}
                </div>
                <button type="button" aria-label={`Edit ${label.toLowerCase()}`} className="p-1 text-gray-500 hover:text-gray-700" onClick={() => {
                  if (isEditing) {
                    setEditingIdx(null);
                    setEditingValue('');
                    return;
                  }
                  setEditingIdx(idx);
                  setEditingValue(item);
                }}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" aria-label={`Remove ${label.toLowerCase()}`} className="p-1 text-red-600 hover:text-red-700" onClick={() => {
                  setItems((prev) => prev.filter((_, itemIdx) => itemIdx !== idx));
                  if (editingIdx === idx) {
                    setEditingIdx(null);
                    setEditingValue('');
                  }
                }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}