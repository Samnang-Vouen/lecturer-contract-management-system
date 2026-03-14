import React from 'react';
import Select, { SelectItem } from '../../../ui/Select.jsx';

export default function StatusField({ form, setForm }) {
  return (
    <div className="flex flex-col min-w-0">
      <label htmlFor="mappingStatus" className="block text-sm font-medium text-gray-700 mb-1">
        Status
      </label>
      <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))} buttonClassName="min-h-[3rem] py-2 text-sm">
        {['Pending', 'Contacting', 'Accepted', 'Rejected'].map((s) => (
          <SelectItem key={`st-${s}`} value={s}>
            {s}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
