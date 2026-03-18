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
    <div className="space-y-2 flex flex-col justify-end">
      <Label htmlFor={name} className="text-sm font-semibold text-slate-700">
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
          className="w-full min-h-[112px] border-slate-200 bg-white focus:border-indigo-500 focus:ring-indigo-500" 
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
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
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
          className="w-full border-slate-200 bg-white focus:border-indigo-500 focus:ring-indigo-500" 
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
