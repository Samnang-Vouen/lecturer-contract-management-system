import React from 'react';
import Input from '../../ui/Input';
import Textarea from '../../ui/Textarea';
import Label from '../../ui/Label';

export default function FormField({ 
  name, 
  label, 
  value, 
  onChange, 
  disabled, 
  as, 
  options, 
  type = 'text', 
  error, 
  onPaste, 
  readOnly 
}) {
  return (
    <div className="space-y-1 flex flex-col justify-end">
      <Label htmlFor={name} className="text-xs font-medium text-gray-600">
        {label}
      </Label>
      {as === 'textarea' && (
        <Textarea 
          id={name} 
          name={name} 
          value={value} 
          onChange={onChange} 
          onPaste={onPaste} 
          disabled={disabled} 
          readOnly={readOnly} 
          className="bg-white w-full" 
          rows={4} 
        />
      )}
      {as === 'select' && (
        <select 
          id={name} 
          name={name} 
          value={value} 
          onChange={onChange} 
          onPaste={onPaste} 
          disabled={disabled} 
          readOnly={readOnly} 
          className="w-full border rounded px-2 py-1 text-sm bg-white disabled:opacity-60"
        >
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {!as && (
        <Input 
          id={name} 
          name={name} 
          value={value} 
          onChange={onChange} 
          onPaste={onPaste} 
          disabled={disabled} 
          readOnly={readOnly} 
          type={type} 
          className="bg-white w-full" 
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
