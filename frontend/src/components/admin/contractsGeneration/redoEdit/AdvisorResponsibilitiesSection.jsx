import React from 'react';
import { Checkbox } from '../../../ui/Checkbox';

export default function AdvisorResponsibilitiesSection({ capstone1, setCapstone1, capstone2, setCapstone2, internship1, setInternship1, internship2, setInternship2, errors }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">Responsibilities</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-700"><Checkbox checked={capstone1} onCheckedChange={(value) => setCapstone1(!!value)} /> Capstone 1</label>
        <label className="flex items-center gap-2 text-sm text-gray-700"><Checkbox checked={capstone2} onCheckedChange={(value) => setCapstone2(!!value)} /> Capstone 2</label>
        <label className="flex items-center gap-2 text-sm text-gray-700"><Checkbox checked={internship1} onCheckedChange={(value) => setInternship1(!!value)} /> Internship 1</label>
        <label className="flex items-center gap-2 text-sm text-gray-700"><Checkbox checked={internship2} onCheckedChange={(value) => setInternship2(!!value)} /> Internship 2</label>
      </div>
      {errors.responsibilities ? <div className="text-xs text-red-600">{errors.responsibilities}</div> : null}
    </div>
  );
}