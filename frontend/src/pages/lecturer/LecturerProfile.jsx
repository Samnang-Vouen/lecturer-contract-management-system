import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getMyLecturerProfile, updateMyLecturerProfile } from '../../services/lecturerProfile.service';
import { useProfileForm } from '../../hooks/lecturer/profile/useProfileForm';
import { usePasswordChange } from '../../hooks/lecturer/profile/usePasswordChange';
import { useFileUpload } from '../../hooks/lecturer/profile/useFileUpload';
import { mapProfileToForm, validateProfile } from '../../utils/profileUtils';
import ProfileHeader from '../../components/lecturer/profile/ProfileHeader';
import PersonalInfoSection from '../../components/lecturer/profile/PersonalInfoSection';
import CoursesSection from '../../components/lecturer/profile/CoursesSection';
import DocumentsSection from '../../components/lecturer/profile/DocumentsSection';
import BankingSection from '../../components/lecturer/profile/BankingSection';
import AccountSettingsSection from '../../components/lecturer/profile/AccountSettingsSection';
import SyllabusUploadDialog from '../../components/lecturer/profile/SyllabusUploadDialog';

export default function LecturerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showSyllabusDialog, setShowSyllabusDialog] = useState(false);

  const { form, setForm, errors, setErrors, onChange, onPaste } = useProfileForm({}, profile, setProfile);
  const {
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
  } = usePasswordChange();
  const { fileUploading, uploadFiles } = useFileUpload(setProfile);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyLecturerProfile();
        setProfile(res);
        setForm(mapProfileToForm(res));
      } catch (e) {
        toast.error(e?.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    const validationErrors = validateProfile(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Fix validation errors');
      return;
    }
    
    setSaving(true);
    try {
      const { hourlyRateThisYear, ...rest } = form;
      const payload = { ...rest, research_fields: form.research_fields };
      const res = await updateMyLecturerProfile(payload);
      setProfile(res?.profile || res);
      toast.success('Profile updated');
      setEditMode(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setForm(mapProfileToForm(profile));
    setEditMode(false);
    setErrors({});
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
      {loading && (
        <div className="space-y-8 animate-pulse">
          <div className="h-44 rounded-2xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-80 rounded-2xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
            <div className="h-80 rounded-2xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 rounded-2xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
            <div className="h-64 rounded-2xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
          </div>
        </div>
      )}
      {!loading && profile && (
        <>
          <ProfileHeader
            profile={profile}
            editMode={editMode}
            saving={saving}
            onEdit={() => setEditMode(true)}
            onSave={save}
            onCancel={cancel}
          />

          <PersonalInfoSection
            form={form}
            profile={profile}
            editMode={editMode}
            errors={errors}
            onChange={onChange}
            onPaste={onPaste}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <CoursesSection profile={profile} />
            <DocumentsSection
              profile={profile}
              editMode={editMode}
              fileUploading={fileUploading}
              onUploadFiles={uploadFiles}
              onOpenSyllabusDialog={() => setShowSyllabusDialog(true)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <BankingSection form={form} editMode={editMode} onChange={onChange} />
            <AccountSettingsSection
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              passwordSaving={passwordSaving}
              showCurrent={showCurrent}
              showNew={showNew}
              showConfirm={showConfirm}
              animCurrent={animCurrent}
              animNew={animNew}
              animConfirm={animConfirm}
              onToggleVisibility={toggleVisibility}
              onChangePassword={changePassword}
            />
          </div>
        </>
      )}

      <SyllabusUploadDialog
        open={showSyllabusDialog}
        onOpenChange={setShowSyllabusDialog}
        onUpload={uploadFiles}
        uploading={fileUploading}
      />
    </div>
  );
}
