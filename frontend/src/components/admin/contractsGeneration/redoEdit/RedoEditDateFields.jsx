import React from 'react';
import Input from '../../../ui/Input';

export default function RedoEditDateFields({ startDate, setStartDate, endDate, setEndDate, errors }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-700">Start date</div>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-700">End date</div>
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        {errors.endDate ? <div className="text-xs text-red-600">{errors.endDate}</div> : null}
      </div>
    </div>
  );
}