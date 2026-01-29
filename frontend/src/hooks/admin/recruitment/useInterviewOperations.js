import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { searchInterviewQuestions } from '../../../services/interview.service';

/**
 * Custom hook for managing interview operations
 */
export function useInterviewOperations(
  selectedCandidate,
  updateCandidate,
  saveResponse,
  updateResponse,
  setSelectedCandidate,
  addQuestion,
  updateQuestion,
  deleteQuestion
) {
  const [savingResponse, setSavingResponse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [questionSuggestions, setQuestionSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const saveRating = useCallback(async (questionId, rating) => {
    if (!selectedCandidate) return;
    
    try {
      setSavingResponse(true);
      
      // Update local state immediately for better UX
      updateResponse(selectedCandidate.id, questionId, { rating });
      
      // Save to backend
      await saveResponse(selectedCandidate.id, questionId, { rating });
      
      toast.success('Rating saved');
    } catch (error) {
      toast.error('Failed to save rating');
    } finally {
      setSavingResponse(false);
    }
  }, [selectedCandidate, updateResponse, saveResponse]);

  const saveNote = useCallback(async (questionId, noted) => {
    if (!selectedCandidate) return;
    
    try {
      // Update local state immediately
      updateResponse(selectedCandidate.id, questionId, { noted });
      
      // Save to backend (debounced)
      await saveResponse(selectedCandidate.id, questionId, { noted });
    } catch (error) {
      toast.error('Failed to save note');
    }
  }, [selectedCandidate, updateResponse, saveResponse]);

  const submitInterview = useCallback(async (averageScore, areAllRated) => {
    if (!selectedCandidate || !areAllRated) {
      toast.error('Please rate all questions before submitting');
      return false;
    }
    
    try {
      setSubmitting(true);
      
      // Auto-reject candidates with score < 2.5
      if (averageScore < 2.5) {
        await updateCandidate(selectedCandidate.id, {
          status: 'rejected',
          interviewScore: averageScore,
          rejectionReason: `Interview score (${averageScore.toFixed(1)}/5.0) below minimum threshold of 2.5`
        });
        
        setSelectedCandidate(prev => ({ 
          ...prev, 
          status: 'rejected', 
          interviewScore: averageScore 
        }));
        
        toast.error(`Candidate automatically rejected due to low interview score (${averageScore.toFixed(1)}/5.0)`);
        return { success: true, step: 'final' };
      } else {
        await updateCandidate(selectedCandidate.id, {
          status: 'discussion',
          interviewScore: averageScore
        });
        
        setSelectedCandidate(prev => ({ 
          ...prev, 
          status: 'discussion', 
          interviewScore: averageScore 
        }));
        
        toast.success('Interview submitted successfully');
        return { success: true, step: 'discussion' };
      }
    } catch (error) {
      toast.error(error.message);
      return { success: false };
    } finally {
      setSubmitting(false);
    }
  }, [selectedCandidate, updateCandidate, setSelectedCandidate]);

  const handleAddQuestion = useCallback(async (questionText, category) => {
    if (!questionText.trim() || !category) return false;
    
    try {
      setSubmitting(true);
      await addQuestion({
        question_text: questionText,
        category: category
      });
      toast.success('Question added successfully');
      return true;
    } catch (error) {
      toast.error(error.message || 'Failed to add question');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [addQuestion]);

  const handleEditQuestion = useCallback(async (questionId, updatedText) => {
    try {
      await updateQuestion(questionId, { question_text: updatedText });
      toast.success('Question updated successfully');
      return true;
    } catch (error) {
      toast.error(error.message || 'Failed to update question');
      return false;
    }
  }, [updateQuestion]);

  const handleDeleteQuestion = useCallback(async (questionId) => {
    try {
      setDeleting(true);
      await deleteQuestion(questionId);
      toast.success('Question deleted successfully');
      return true;
    } catch (error) {
      toast.error(error.message || 'Failed to delete question');
      return false;
    } finally {
      setDeleting(false);
    }
  }, [deleteQuestion]);

  const fetchQuestionSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 3) {
      setQuestionSuggestions([]);
      return;
    }
    
    try {
      setLoadingSuggestions(true);
      const results = await searchInterviewQuestions(query);
      setQuestionSuggestions(results || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setQuestionSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  return {
    savingResponse,
    submitting,
    deleting,
    questionSuggestions,
    loadingSuggestions,
    saveRating,
    saveNote,
    submitInterview,
    handleAddQuestion,
    handleEditQuestion,
    handleDeleteQuestion,
    fetchQuestionSuggestions
  };
}
