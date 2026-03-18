import React from 'react';
import Input from '../../../ui/Input';
import Select, { SelectItem } from '../../../ui/Select';

export default function AdvisorBasicsSection({
  role,
  setRole,
  hourlyRate,
  setHourlyRate,
  hoursPerStudent,
  setHoursPerStudent,
  joinJudgingHours,
  setJoinJudgingHours,
  errors,
  setErrors,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-700">Role</div>
        <Select
          className="w-full cursor-pointer"
          value={role}
          onValueChange={(value) => {
            setRole(value);
            setErrors((prev) => ({ ...(prev || {}), role: '' }));
          }}
          placeholder="Select role"
        >
          <SelectItem value="ADVISOR">ADVISOR</SelectItem>
          <SelectItem value="LECTURE">LECTURE</SelectItem>
        </Select>
        {errors.role ? <div className="text-xs text-red-600">{errors.role}</div> : null}
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-700">Hourly rate</div>
        <Input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="e.g. 12.5" />
        {errors.hourlyRate ? <div className="text-xs text-red-600">{errors.hourlyRate}</div> : null}
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-700">Hours per student</div>
        <Input value={hoursPerStudent} onChange={(e) => setHoursPerStudent(e.target.value)} placeholder="e.g. 6" />
        {errors.hoursPerStudent ? <div className="text-xs text-red-600">{errors.hoursPerStudent}</div> : null}
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-700">Join judging hours (per student)</div>
        <Input value={joinJudgingHours} onChange={(e) => setJoinJudgingHours(e.target.value)} placeholder="Optional" />
      </div>
    </div>
  );
}