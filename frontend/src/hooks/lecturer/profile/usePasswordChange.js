import { useState } from 'react';
import toast from 'react-hot-toast';
import { changeMyPassword } from '../../../services/profile.service';
import { validatePassword } from '../../../utils/profileUtils';

export function usePasswordChange() {
  const [passwordForm, setPasswordForm] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirm: '' 
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [animCurrent, setAnimCurrent] = useState(false);
  const [animNew, setAnimNew] = useState(false);
  const [animConfirm, setAnimConfirm] = useState(false);

  const toggleVisibility = (field) => {
    if (field === 'current') {
      setShowCurrent(s => !s);
      setAnimCurrent(true);
      setTimeout(() => setAnimCurrent(false), 200);
    } else if (field === 'new') {
      setShowNew(s => !s);
      setAnimNew(true);
      setTimeout(() => setAnimNew(false), 200);
    } else if (field === 'confirm') {
      setShowConfirm(s => !s);
      setAnimConfirm(true);
      setTimeout(() => setAnimConfirm(false), 200);
    }
  };

  const changePassword = async () => {
    const error = validatePassword(passwordForm);
    if (error) {
      toast.error(error);
      return;
    }
    
    setPasswordSaving(true);
    try {
      await changeMyPassword({ 
        currentPassword: passwordForm.currentPassword, 
        newPassword: passwordForm.newPassword 
      });
      toast.success('Password updated');
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Password change failed');
    } finally {
      setPasswordSaving(false);
    }
  };

  return {
    passwordForm,
    setPasswordForm,
    passwordSaving,
    showCurrent,
    showNew,
    showConfirm,
    animCurrent,
    animNew,
    animConfirm,
    toggleVisibility,
    changePassword
  };
}
