import React from 'react';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';

export default function SimpleStringListEditor({ title, error, inputValue, onInputChange, onAdd, items, onRemove, placeholder }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">{title}</div>
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input value={inputValue} onChange={(e) => onInputChange(e.target.value)} placeholder={placeholder} />
        <Button className="w-full sm:w-auto" variant="secondary" onClick={onAdd}>Add</Button>
      </div>
      <div className="space-y-2">
        {(items || []).map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <div className="text-sm text-gray-800 truncate">{item}</div>
            <Button variant="danger" size="sm" onClick={() => onRemove(idx)}>Remove</Button>
          </div>
        ))}
      </div>
    </div>
  );
}