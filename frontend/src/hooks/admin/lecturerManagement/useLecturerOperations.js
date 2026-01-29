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
      await deleteLecturer(lecturerToDelete.id);
      setLecturers(prev => prev.filter(l => l.id !== lecturerToDelete.id));
      toast.success('Lecturer deleted');
    } catch (e) {
      console.error('Delete lecturer failed', e);
      toast.error('Failed to delete lecturer');
    } finally {
      cancelDelete();
    }
  };

  const handleDeactivate = async (lecturer) => {
    try {
      const data = await toggleLecturerStatus(lecturer.id);
      setLecturers(prev => prev.map(l => 
        l.id === lecturer.id ? { ...l, status: data.status } : l
      ));
      toast.success(`Lecturer ${data.status === 'active' ? 'activated' : 'deactivated'}`);
    } catch (e) {
      console.error('Toggle status failed', e);
      toast.error('Failed to update status');
    }
  };

  const saveProfile = async (selectedLecturer, getLecturerDetailFn) => {
    if (!selectedLecturer) return false;
    
    try {
      // Save bio & research fields
      await updateLecturerProfile(selectedLecturer.id, {
        short_bio: selectedLecturer.bio || '',
        research_fields: selectedLecturer.specialization.join(','),
        phone_number: selectedLecturer.phone || null,
        bank_name: selectedLecturer.bank_name || null,
        account_name: selectedLecturer.account_name || null,
        account_number: selectedLecturer.account_number || null
      });

      // Update position/status
      await updateLecturer(selectedLecturer.id, {
        position: selectedLecturer.position,
        status: selectedLecturer.status
      });

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

  const handlePayrollUpload = async (lecturerId, file, onSuccess) => {
    if (!file) return;
    
    try {
      toast.loading('Uploading payroll...');
      const data = await uploadLecturerPayroll(lecturerId, file);
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
