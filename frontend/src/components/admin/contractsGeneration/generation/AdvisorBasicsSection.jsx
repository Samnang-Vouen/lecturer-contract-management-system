import React from 'react';
import Input from '../../../ui/Input';
import Select, { SelectItem } from '../../../ui/Select';

export default function AdvisorBasicsSection({ lecturers, advisorUsers, advisorUsersLoading, advisorUsersLoadError, advLecturerKey, handleAdvisorLecturerChange, advErrors, setAdvErrors, advHourlyRate, setAdvHourlyRate, advHoursPerStudent, setAdvHoursPerStudent }) {
  return (
    <>
      <div className="space-y-1 mb-4">
        <label className="block text-sm font-medium">Advisor Name <span className="text-red-600">*</span></label>
        <Select className="w-full cursor-pointer" value={advLecturerKey} onValueChange={handleAdvisorLecturerChange} placeholder="Enter advisor name">
          {(advisorUsers.length ? advisorUsers : lecturers).map((user) => (
            <SelectItem key={user.id} value={String(user.id)}>{user.name || user.full_name_english || user.full_name_khmer || user.display_name || user.email}</SelectItem>
          ))}
        </Select>
        {advisorUsersLoading ? <p className="text-xs text-gray-500">Loading advisors...</p> : null}
        {advisorUsersLoadError ? <p className="text-xs text-red-600">{advisorUsersLoadError}</p> : null}
        {!advisorUsersLoading && !advisorUsers.length && !lecturers.length ? <p className="text-xs text-amber-600">No lecturers found. Try selecting another academic year or ensure Accepted course mappings exist.</p> : null}
        <p className="text-xs text-gray-500">Generating an advisor contract will also add the <span className="font-medium">Advisor</span> role to this lecturer.</p>
        {advErrors.lecturer ? <p className="text-xs text-red-600">{advErrors.lecturer}</p> : null}
      </div>

      <div className="space-y-1 mb-4">
        <label className="block text-sm font-medium">Hourly Rate ($) <span className="text-red-600">*</span></label>
        <Input className="w-full cursor-pointer h-11 text-base shadow-sm" value={advHourlyRate} onChange={(e) => {
          setAdvHourlyRate(e.target.value);
          setAdvErrors((prev) => ({ ...prev, hourlyRate: '' }));
        }} />
        {advErrors.hourlyRate ? <p className="text-xs text-red-600">{advErrors.hourlyRate}</p> : null}
      </div>

      <div className="space-y-1 mb-4">
        <label className="block text-sm font-medium">Number of Hour per Student <span className="text-red-600">*</span></label>
        <Input className="w-full cursor-pointer h-11 text-base shadow-sm" inputMode="numeric" pattern="[0-9]*" value={advHoursPerStudent} onChange={(e) => {
          setAdvHoursPerStudent(String(e.target.value || '').replace(/[^0-9]/g, ''));
          setAdvErrors((prev) => ({ ...prev, hoursPerStudent: '' }));
        }} />
        {advErrors.hoursPerStudent ? <p className="text-xs text-red-600">{advErrors.hoursPerStudent}</p> : null}
      </div>
    </>
  );
}