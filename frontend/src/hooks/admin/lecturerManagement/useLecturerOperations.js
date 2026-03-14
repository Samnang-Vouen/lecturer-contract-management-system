import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  deleteLecturer,
  toggleLecturerStatus,
  updateLecturerProfile,
  updateLecturer,
  uploadLecturerPayroll,
  updateCandidateHourlyRate
} from '../../../services/lecturer.service';
import {
  deleteAdvisor,
  toggleAdvisorStatus,
  updateAdvisorProfile,
  updateAdvisor,
  uploadAdvisorPayroll,
} from '../../../services/advisor.service';

const isAdvisorTarget = (target) => {
  const toToken = (r) => {
    if (r === null || r === undefined) return '';
    if (typeof r === 'string' || typeof r === 'number') return String(r);
    if (typeof r === 'object') return r.role ?? r.name ?? r.code ?? r.type ?? r.value ?? '';
    return String(r);
  };

  const rawValues = [target?.role, target?.roles, target?.user?.role, target?.user?.roles];
  const flattened = [];
  for (const v of rawValues) {
    if (!v) continue;
    if (Array.isArray(v)) for (const item of v) flattened.push(toToken(item));
    else flattened.push(toToken(v));
  }

  const roleTokens = flattened
    .flatMap((s) => String(s ?? '').split(','))
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const hasAdvisorRole = roleTokens.some((t) => t === 'advisor' || t.includes('advisor'));
  const hasLecturerRole = roleTokens.some((t) => t === 'lecturer' || t === 'lecture' || t.includes('lectur'));
  if (hasLecturerRole) return false;
  if (hasAdvisorRole) return true;

  const positionLc = String(target?.position || '').trim().toLowerCase();
  return positionLc === 'advisor';
};

export function useLecturerOperations(setLecturers) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [lecturerToDelete, setLecturerToDelete] = useState(null);

  const requestDelete = (lecturer) => {
    setLecturerToDelete(lecturer);
    setIsDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setLecturerToDelete(null);
  };

  const confirmDelete = async () => {
    if (!lecturerToDelete) return;
    
    try {
      if (isAdvisorTarget(lecturerToDelete)) await deleteAdvisor(lecturerToDelete.id);
      else await deleteLecturer(lecturerToDelete.id);
      setLecturers(prev => prev.filter(l => l.id !== lecturerToDelete.id));
      toast.success(isAdvisorTarget(lecturerToDelete) ? 'Advisor deleted' : 'Lecturer deleted');
    } catch (e) {
      console.error('Delete lecturer failed', e);
      toast.error('Failed to delete lecturer');
    } finally {
      cancelDelete();
    }
  };

  const handleDeactivate = async (lecturer) => {
    try {
      const data = isAdvisorTarget(lecturer)
        ? await toggleAdvisorStatus(lecturer.id)
        : await toggleLecturerStatus(lecturer.id);
      setLecturers(prev => prev.map(l => 
        l.id === lecturer.id ? { ...l, status: data.status } : l
      ));
      toast.success(`${isAdvisorTarget(lecturer) ? 'Advisor' : 'Lecturer'} ${data.status === 'active' ? 'activated' : 'deactivated'}`);
    } catch (e) {
      console.error('Toggle status failed', e);
      toast.error('Failed to update status');
    }
  };

  const saveProfile = async (selectedLecturer, getLecturerDetailFn) => {
    if (!selectedLecturer) return false;
    
    try {
      const isAdvisor = isAdvisorTarget(selectedLecturer);

      // Save bio & research fields
      const updateProfile = isAdvisor ? updateAdvisorProfile : updateLecturerProfile;
      await updateProfile(selectedLecturer.id, {
        short_bio: selectedLecturer.bio || '',
        research_fields: selectedLecturer.specialization.join(','),
        phone_number: selectedLecturer.phone || null,
        bank_name: selectedLecturer.bank_name || null,
        account_name: selectedLecturer.account_name || null,
        account_number: selectedLecturer.account_number || null
      });

      // Update position/status
      const updateUserFn = isAdvisor ? updateAdvisor : updateLecturer;
      const updatePayload = isAdvisor
        ? { status: selectedLecturer.status }
        : { position: selectedLecturer.position, status: selectedLecturer.status };
      await updateUserFn(selectedLecturer.id, updatePayload);

      // Update hourly rate if available
      if (selectedLecturer.candidateId && (selectedLecturer.hourlyRateThisYear ?? '') !== '') {
        try {
          await updateCandidateHourlyRate(selectedLecturer.candidateId, selectedLecturer.hourlyRateThisYear);
        } catch (candErr) {
          console.warn('Failed to update candidate hourly rate', candErr);
        }
      }

      // Update table
      setLecturers(prev => prev.map(l => 
        l.id === selectedLecturer.id 
          ? { ...l, status: selectedLecturer.status, position: selectedLecturer.position }
          : l
      ));

      // Refetch detail if function provided
      if (getLecturerDetailFn) {
        try {
          await getLecturerDetailFn(selectedLecturer.id);
        } catch {}
      }

      toast.success('Profile updated');
      return true;
    } catch (e) {
      console.error(e);
      toast.error('Save failed');
      return false;
    }
  };

  const handlePayrollUpload = async (target, file, onSuccess) => {
    if (!file) return;
    
    try {
      toast.loading('Uploading payroll...');
      const uploader = isAdvisorTarget(target) ? uploadAdvisorPayroll : uploadLecturerPayroll;
      const data = await uploader(target.id, file);
      const newPath = data.path || data.payrollFilePath || data.profile?.pay_roll_in_riel || 
                      data.profile?.payrollPath || data.pay_roll_in_riel;
      
      toast.dismiss();
      toast.success('Payroll uploaded');
      
      if (onSuccess) {
        onSuccess(newPath);
      }
      
      return newPath;
    } catch (e) {
      toast.dismiss();
      toast.error(e.response?.data?.message || 'Upload failed');
      console.error(e);
      return null;
    }
  };

  return {
    isDeleteModalOpen,
    lecturerToDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    handleDeactivate,
    saveProfile,
    handlePayrollUpload
  };
}
