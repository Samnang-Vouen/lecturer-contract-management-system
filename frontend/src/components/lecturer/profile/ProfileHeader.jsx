import React from 'react';
import { Card, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import Avatar from './Avatar';
import StatusBadge from './StatusBadge';
import OverviewItem from './OverviewItem';
import { Shield } from 'lucide-react';

export default function ProfileHeader({ 
  profile, 
  editMode, 
  saving, 
  onEdit, 
  onSave, 
  onCancel 
}) {
  return (
    <Card className="shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100/70 bg-white rounded-2xl overflow-hidden group">
      <CardContent className="p-6 md:p-10">
        <div className="flex flex-col xl:flex-row gap-10 items-start xl:items-center">
          <div className="flex items-center gap-6 w-full md:w-auto">
            <Avatar name={profile.full_name_english || profile.user_display_name || 'Lecturer'} />
            <div className="space-y-1.5">
              <h1 className="text-2xl md:text-[2rem] font-semibold leading-tight text-gray-900 tracking-tight flex items-center gap-3 break-words">
                <span>{profile.full_name_english || 'Unnamed Lecturer'}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm">
                  Profile
                </span>
              </h1>
              {profile.full_name_khmer && (
                <p className="text-lg md:text-xl font-medium text-indigo-600/90 leading-snug tracking-wide drop-shadow-sm">
                  {profile.full_name_khmer}
                </p>
              )}
              <p className="text-[11px] inline-flex items-center gap-1.5 bg-indigo-50/70 text-indigo-700 px-2.5 py-1 rounded-full tracking-wide shadow-sm ring-1 ring-indigo-100">
                <Shield className="h-3.5 w-3.5" /> {profile.position}
              </p>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 text-[13px] mt-4 md:mt-0">
            <OverviewItem label="Status" value={<StatusBadge status={profile.status} />} />
            <OverviewItem label="Employee ID" value={profile.employee_id} />
            <OverviewItem label="Department" value={profile.department_name || '—'} />
            <OverviewItem label="Join Date" value={new Date(profile.join_date).toLocaleDateString()} />
          </div>
          <div className="xl:ml-auto flex flex-col sm:flex-row gap-2 mt-4 xl:mt-0 w-full xl:w-auto">
            {editMode ? (
              <>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={onCancel} 
                  disabled={saving} 
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={onSave} 
                  disabled={saving} 
                  className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button 
                size="sm" 
                onClick={onEdit} 
                className="bg-indigo-600 hover:bg-indigo-700 shadow-sm group-hover:shadow-md transition-shadow w-full sm:w-auto"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
