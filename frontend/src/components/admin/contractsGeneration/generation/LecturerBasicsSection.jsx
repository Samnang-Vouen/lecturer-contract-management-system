import React from 'react';
import Input from '../../../ui/Input';
import Select, { SelectItem } from '../../../ui/Select';

export default function LecturerBasicsSection({ lecturers, dlgLecturerKey, handleLecturerChange, dlgErrors, dlgHourlyRate }) {
  return (
    <>
      <div className="space-y-1 mb-4">
        <label className="block text-sm font-medium">Lecturer Name <span className="text-red-600">*</span></label>
        <Select className="w-full cursor-pointer" value={dlgLecturerKey} onValueChange={handleLecturerChange} placeholder="Select lecturer name">
          {lecturers.map((lecturer) => (
            <SelectItem key={lecturer.id} value={lecturer.id}>{lecturer.name || lecturer.full_name_english || lecturer.full_name_khmer}</SelectItem>
          ))}
        </Select>
        {!lecturers.length ? <p className="text-xs text-amber-600">No lecturers found. Try selecting another academic year or ensure Accepted course mappings exist.</p> : null}
        {dlgErrors.lecturer ? <p className="text-xs text-red-600">{dlgErrors.lecturer}</p> : null}
      </div>

      <div className="space-y-1 mb-4">
        <label className="block text-sm font-medium">Hourly Rate ($)</label>
        <Input className="w-full cursor-pointer h-11 text-base shadow-sm" value={dlgHourlyRate} readOnly />
      </div>
    </>
  );
}