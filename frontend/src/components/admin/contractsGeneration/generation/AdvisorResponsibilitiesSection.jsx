import React from 'react';
import { Checkbox } from '../../../ui/Checkbox';

export default function AdvisorResponsibilitiesSection({ advCapstone1, setAdvCapstone1, advCapstone2, setAdvCapstone2, advInternship1, setAdvInternship1, advInternship2, setAdvInternship2, setAdvErrors, advErrors }) {
  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2"><label className="block text-sm font-medium">Capstone:</label><span className="text-red-600 text-sm">*</span></div>
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-gray-900 select-none"><Checkbox checked={advCapstone1} onCheckedChange={(value) => { setAdvCapstone1(!!value); setAdvErrors((prev) => ({ ...prev, responsibilities: '' })); }} />Capstone 1</label>
        <label className="inline-flex items-center gap-2 text-sm text-gray-900 select-none"><Checkbox checked={advCapstone2} onCheckedChange={(value) => { setAdvCapstone2(!!value); setAdvErrors((prev) => ({ ...prev, responsibilities: '' })); }} />Capstone 2</label>
      </div>
      <label className="block text-sm font-medium">Internship:</label>
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-gray-900 select-none"><Checkbox checked={advInternship1} onCheckedChange={(value) => { setAdvInternship1(!!value); setAdvErrors((prev) => ({ ...prev, responsibilities: '' })); }} />Internship 1</label>
        <label className="inline-flex items-center gap-2 text-sm text-gray-900 select-none"><Checkbox checked={advInternship2} onCheckedChange={(value) => { setAdvInternship2(!!value); setAdvErrors((prev) => ({ ...prev, responsibilities: '' })); }} />Internship 2</label>
      </div>
      {advErrors.responsibilities ? <p className="text-xs text-red-600">{advErrors.responsibilities}</p> : null}
    </div>
  );
}