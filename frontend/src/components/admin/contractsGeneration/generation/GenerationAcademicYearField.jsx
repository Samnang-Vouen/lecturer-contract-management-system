import React from 'react';
import Input from '../../../ui/Input';

export default function GenerationAcademicYearField({ academicYear, onAcademicYearChange }) {
  return (
    <div className="space-y-1 mb-4">
      <label className="block text-sm font-medium">Academic Year <span className="text-red-600">*</span></label>
      <Input className="w-full cursor-pointer h-11 text-base shadow-sm" value={academicYear} onChange={(e) => onAcademicYearChange(e.target.value)} />
    </div>
  );
}