import React from 'react';
import Input from '../../ui/Input';

/**
 * Step 4: Professional Information
 */
export default function OnboardingProfessional({ formData, updateForm }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Current Occupation <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </label>
          <Input
            value={formData.occupation}
            onChange={(e) => updateForm('occupation', e.target.value)}
            placeholder="Enter your current occupation"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Place of Work <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </label>
          <Input
            value={formData.placeOfWork}
            onChange={(e) => updateForm('placeOfWork', e.target.value)}
            placeholder="Enter your workplace"
            required
          />
        </div>
      </div>
    </div>
  );
}
