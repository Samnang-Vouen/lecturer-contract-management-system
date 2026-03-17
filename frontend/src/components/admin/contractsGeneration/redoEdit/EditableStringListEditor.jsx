import React from 'react';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';

export default function EditableStringListEditor({
  title,
  error,
  inputValue,
  onInputChange,
  onAdd,
  items,
  editingItemIdx,
  editingItemValue,
  onEditingItemValueChange,
  onStartEdit,
  onCommitEdit,
  onRemove,
  placeholder,
}) {
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
          <div key={idx} className="rounded-lg border border-gray-200 px-3 py-2">
            {editingItemIdx === idx ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <Input value={editingItemValue} onChange={(e) => onEditingItemValueChange(e.target.value)} />
                <Button className="w-full sm:w-auto" variant="secondary" size="sm" onClick={onCommitEdit}>Save</Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm text-gray-800 truncate">{item}</div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onStartEdit(idx)}>Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => onRemove(idx)}>Remove</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}