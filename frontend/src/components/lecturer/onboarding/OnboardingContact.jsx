import React from 'react';
import Input from '../../ui/Input';
import { useAuthStore } from '../../../store/useAuthStore';

/**
 * Step 5: Contact Information
 */
export default function OnboardingContact({ 
  formData, 
  updateForm, 
  phoneNumber, 
  handlePhoneChange 
}) {
  const { authUser } = useAuthStore();

  const onPhoneChange = (e) => {
    handlePhoneChange(e.target.value);
    updateForm('phoneNumber', e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Phone Number <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </label>
          <Input
            type="tel"
            value={phoneNumber}
            onChange={onPhoneChange}
            placeholder="+855 12 345 678"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Personal Email <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </label>
          <Input
            type="email"
            value={formData.personalEmail}
            onChange={(e) => updateForm('personalEmail', e.target.value)}
            placeholder="Enter your personal email"
            required
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700">
            School Email Address
          </label>
          <Input
            type="email"
            value={formData.schoolEmail || authUser?.email || ''}
            readOnly
            placeholder="Institution email"
            className="bg-gray-50 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500">
            Filled from your login account and cannot be changed here.
          </p>
        </div>
      </div>
    </div>
  );
}
