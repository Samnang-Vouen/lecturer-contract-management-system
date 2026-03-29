import React from 'react';
import Input from '../../../ui/Input';

export default function RedoEditDateFields({ startDate, setStartDate, endDate, setEndDate, errors, setErrors }) {
  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
    setErrors?.((current) => ({ ...current, startDate: '' }));
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
    setErrors?.((current) => ({ ...current, endDate: '' }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-700">Start date</div>
        <Input type="date" value={startDate} onChange={handleStartDateChange} invalid={!!errors.startDate} />
        {errors.startDate ? <div className="text-xs text-red-600">{errors.startDate}</div> : null}
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-700">End date</div>
        <Input type="date" value={endDate} onChange={handleEndDateChange} invalid={!!errors.endDate} />
        {errors.endDate ? <div className="text-xs text-red-600">{errors.endDate}</div> : null}
      </div>
    </div>
  );
}