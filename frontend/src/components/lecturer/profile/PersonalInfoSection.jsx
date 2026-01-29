import React from 'react';
import { Card, CardContent } from '../../ui/Card';
import SectionHeader from './SectionHeader';
import FormField from './FormField';
import ReadOnlyField from './ReadOnlyField';
import { User } from 'lucide-react';

export default function PersonalInfoSection({ 
  form, 
  profile, 
  editMode, 
  errors, 
  onChange, 
  onPaste 
}) {
  return (
    <Card className="shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-white rounded-2xl border border-gray-100/70">
      <SectionHeader title="Personal Information" icon={<User className="h-4 w-4" />} accent="blue" />
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          <FormField 
            name="full_name_english" 
            label="Full Name (English)" 
            value={form.full_name_english} 
            onChange={onChange} 
            onPaste={onPaste} 
            error={errors.full_name_english} 
            disabled={!editMode} 
          />
          <FormField 
            name="full_name_khmer" 
            label="Full Name (Khmer)" 
            value={form.full_name_khmer} 
            onChange={onChange} 
            disabled={!editMode} 
          />
          <FormField 
            name="phone_number" 
            label="Contact Number" 
            value={form.phone_number} 
            onChange={onChange} 
            disabled={!editMode} 
            error={errors.phone_number} 
          />
          <div className="md:col-span-2 xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
            <ReadOnlyField label="School Email" value={profile.user_email || profile.email || ''} />
            <ReadOnlyField label="Position" value={profile.position || profile.occupation || ''} />
            <ReadOnlyField 
              label="Hourly Rate This Year" 
              value={
                form.hourlyRateThisYear && !isNaN(Number(form.hourlyRateThisYear))
                  ? `$${Number(form.hourlyRateThisYear).toFixed(2)}`
                  : ''
              } 
            />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <FormField 
              name="short_bio" 
              label="Short Bio" 
              as="textarea" 
              value={form.short_bio} 
              onChange={onChange} 
              onPaste={onPaste} 
              disabled={!editMode} 
            />
            {editMode && (
              <p className="text-xs text-gray-500 mt-1">
                {(form.short_bio || '').length}/160 characters
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
