import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing candidate operations
 */
export function useCandidateOperations(
  createCandidate,
  updateCandidate,
  deleteCandidate,
  selectedCandidate,
  setSelectedCandidate
) {
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCreateCandidate = useCallback(async (candidateData) => {
    try {
      setSubmitting(true);
      
      await createCandidate({
        ...candidateData,
        interviewDate: candidateData.interviewDate ? new Date(candidateData.interviewDate).toISOString() : null
      });
      
      toast.success('Candidate added successfully');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [createCandidate]);

  const handleUpdateCandidateStatus = useCallback(async (candidateId, status, additionalData = {}) => {
    try {
      setSubmitting(true);
      
      await updateCandidate(candidateId, {
        status,
        ...additionalData
      });
      
      // Update selected candidate if it's the one being updated
      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate(prev => ({ ...prev, status, ...additionalData }));
      }
      
      toast.success(`Candidate ${status === 'accepted' ? 'accepted' : 'rejected'} successfully`);
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [updateCandidate, selectedCandidate, setSelectedCandidate]);

  const handleDeleteCandidate = useCallback(async (candidateId) => {
    try {
      setDeleting(true);
      
      await deleteCandidate(candidateId);
      
      // Clear selected candidate if it was deleted
      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate(null);
      }
      
      toast.success('Candidate deleted successfully');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setDeleting(false);
    }
  }, [deleteCandidate, selectedCandidate, setSelectedCandidate]);

  return {
    submitting,
    deleting,
    handleCreateCandidate,
    handleUpdateCandidateStatus,
    handleDeleteCandidate
  };
}
