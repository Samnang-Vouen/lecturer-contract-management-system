import React from 'react';
import { Card, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Label from '../../ui/Label';
import SectionHeader from './SectionHeader';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function AccountSettingsSection({ 
  passwordForm, 
  setPasswordForm, 
  passwordSaving, 
  showCurrent, 
  showNew, 
  showConfirm, 
  animCurrent, 
  animNew, 
  animConfirm, 
  onToggleVisibility, 
  onChangePassword 
}) {
  return (
    <Card className="shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-white rounded-2xl border border-gray-100/70">
      <SectionHeader title="Account Settings" icon={<Lock className="h-4 w-4" />} accent="red" />
      <CardContent className="pt-5 space-y-4">
        <div className="grid gap-2">
          <Label className="text-xs font-medium text-gray-600">Current Password</Label>
          <div className="relative">
            <Input 
              id="currentPassword" 
              name="currentPassword" 
              type={showCurrent ? 'text' : 'password'} 
              value={passwordForm.currentPassword} 
              onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} 
              placeholder="••••••" 
              className="pr-10" 
            />
            <button
              type="button"
              aria-label="Toggle current password visibility"
              onClick={() => onToggleVisibility('current')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showCurrent ? (
                <Eye className={`h-4 w-4 transition-transform ${animCurrent ? 'scale-110 rotate-12' : ''}`} />
              ) : (
                <EyeOff className={`h-4 w-4 transition-transform ${animCurrent ? 'scale-110 rotate-12' : ''}`} />
              )}
            </button>
          </div>
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-medium text-gray-600">New Password</Label>
          <div className="relative">
            <Input 
              id="newPassword" 
              name="newPassword" 
              type={showNew ? 'text' : 'password'} 
              value={passwordForm.newPassword} 
              onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} 
              placeholder="At least 6 characters" 
              className="pr-10" 
            />
            <button
              type="button"
              aria-label="Toggle new password visibility"
              onClick={() => onToggleVisibility('new')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showNew ? (
                <Eye className={`h-4 w-4 transition-transform ${animNew ? 'scale-110 rotate-12' : ''}`} />
              ) : (
                <EyeOff className={`h-4 w-4 transition-transform ${animNew ? 'scale-110 rotate-12' : ''}`} />
              )}
            </button>
          </div>
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-medium text-gray-600">Confirm New Password</Label>
          <div className="relative">
            <Input 
              id="confirmPassword" 
              name="confirmPassword" 
              type={showConfirm ? 'text' : 'password'} 
              value={passwordForm.confirm} 
              onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} 
              placeholder="Repeat new password" 
              className="pr-10" 
            />
            <button
              type="button"
              aria-label="Toggle confirm password visibility"
              onClick={() => onToggleVisibility('confirm')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showConfirm ? (
                <Eye className={`h-4 w-4 transition-transform ${animConfirm ? 'scale-110 rotate-12' : ''}`} />
              ) : (
                <EyeOff className={`h-4 w-4 transition-transform ${animConfirm ? 'scale-110 rotate-12' : ''}`} />
              )}
            </button>
          </div>
        </div>
        <Button type="button" onClick={onChangePassword} disabled={passwordSaving}>
          {passwordSaving ? 'Updating...' : 'Update Password'}
        </Button>
      </CardContent>
    </Card>
  );
}
