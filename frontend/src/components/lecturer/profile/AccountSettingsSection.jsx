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
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <SectionHeader title="Account Settings" icon={<Lock className="h-4 w-4" />} accent="red" />
      <CardContent className="p-6 sm:p-8 space-y-5">
        <div className="grid gap-2">
          <Label className="text-sm font-semibold text-slate-700">Current Password</Label>
          <div className="relative">
            <Input 
              id="currentPassword" 
              name="currentPassword" 
              type={showCurrent ? 'text' : 'password'} 
              value={passwordForm.currentPassword} 
              onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} 
              placeholder="••••••" 
              className="pr-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" 
            />
            <button
              type="button"
              aria-label="Toggle current password visibility"
              onClick={() => onToggleVisibility('current')}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
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
          <Label className="text-sm font-semibold text-slate-700">New Password</Label>
          <div className="relative">
            <Input 
              id="newPassword" 
              name="newPassword" 
              type={showNew ? 'text' : 'password'} 
              value={passwordForm.newPassword} 
              onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} 
              placeholder="At least 6 characters" 
              className="pr-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" 
            />
            <button
              type="button"
              aria-label="Toggle new password visibility"
              onClick={() => onToggleVisibility('new')}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
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
          <Label className="text-sm font-semibold text-slate-700">Confirm New Password</Label>
          <div className="relative">
            <Input 
              id="confirmPassword" 
              name="confirmPassword" 
              type={showConfirm ? 'text' : 'password'} 
              value={passwordForm.confirm} 
              onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} 
              placeholder="Repeat new password" 
              className="pr-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" 
            />
            <button
              type="button"
              aria-label="Toggle confirm password visibility"
              onClick={() => onToggleVisibility('confirm')}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirm ? (
                <Eye className={`h-4 w-4 transition-transform ${animConfirm ? 'scale-110 rotate-12' : ''}`} />
              ) : (
                <EyeOff className={`h-4 w-4 transition-transform ${animConfirm ? 'scale-110 rotate-12' : ''}`} />
              )}
            </button>
          </div>
        </div>
        <Button
          type="button"
          onClick={onChangePassword}
          disabled={passwordSaving}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200"
        >
          {passwordSaving ? 'Updating...' : 'Update Password'}
        </Button>
      </CardContent>
    </Card>
  );
}
