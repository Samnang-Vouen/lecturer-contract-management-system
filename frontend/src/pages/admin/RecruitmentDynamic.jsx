import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCandidates } from '../../hooks/admin/recruitment/useCandidates';
import { useInterviewQuestions } from '../../hooks/useInterviewQuestions';
import { useCandidateResponses } from '../../hooks/admin/recruitment/useCandidateResponses';
import { useCandidateOperations } from '../../hooks/admin/recruitment/useCandidateOperations';
import { useInterviewOperations } from '../../hooks/admin/recruitment/useInterviewOperations';
import { useErrorHandler, useInfiniteScroll, useModalState } from '../../hooks/admin/recruitment/useRecruitmentHelpers';
import RecruitmentHeader from '../../components/admin/recruitment/RecruitmentHeader';
import StepNavigation from '../../components/admin/recruitment/StepNavigation';
import CandidatesSidebar from '../../components/admin/recruitment/CandidatesSidebar';
import AddCandidateForm from '../../components/admin/recruitment/AddCandidateForm';
import InterviewEvaluation from '../../components/admin/recruitment/InterviewEvaluation';
import DiscussionStep from '../../components/admin/recruitment/DiscussionStep';
import FinalDecisionStep from '../../components/admin/recruitment/FinalDecisionStep';
import DeleteModal from '../../components/admin/recruitment/DeleteModal';
import AcceptCandidateModal from '../../components/admin/recruitment/AcceptCandidateModal';
import RejectCandidateModal from '../../components/admin/recruitment/RejectCandidateModal';
import AddQuestionModal from '../../components/admin/recruitment/AddQuestionModal';
import EditQuestionModal from '../../components/admin/recruitment/EditQuestionModal';
import ViewCandidateModal from '../../components/admin/recruitment/ViewCandidateModal';

export default function RecruitmentDynamic() {
  // Custom hooks for API integration
  const {
    candidates,
    loading: candidatesLoading,
    error: candidatesError,
    pagination,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    loadMore,
    refresh: refreshCandidates,
    setError: setCandidatesError
  } = useCandidates();

  const {
    categories,
    loading: questionsLoading,
    error: questionsError,
    refresh: refreshQuestions,
    setError: setQuestionsError,
    addQuestion,
    updateQuestion,
    deleteQuestion
  } = useInterviewQuestions();

  const {
    candidateResponses,
    loading: responsesLoading,
    error: responsesError,
    fetchCandidateInterviewDetails,
    saveResponse,
    updateResponse,
    calculateAverageScore,
    setError: setResponsesError
  } = useCandidateResponses();

  // Component state
  const loadMoreRef = useRef(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeStep, setActiveStep] = useState('add');
  const [openCategories, setOpenCategories] = useState(['Teaching Skills']);
  const [candidateSearch, setCandidateSearch] = useState('');

  // Form states
  const [newCandidate, setNewCandidate] = useState({ 
    fullName: '', 
    email: '', 
    phone: '+855', 
    positionAppliedFor: '', 
    interviewDate: '' 
  });
  const [finalDecision, setFinalDecision] = useState({ 
    hourlyRate: '', 
    rateReason: '', 
    evaluator: '' 
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [showViewQuestionsModal, setShowViewQuestionsModal] = useState(false);
  const [viewQuestionsCandidate, setViewQuestionsCandidate] = useState(null);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showDeleteQuestionModal, setShowDeleteQuestionModal] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [addingQuestionCategory, setAddingQuestionCategory] = useState(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Custom hooks for operations
  const {
    submitting,
    deleting,
    handleCreateCandidate,
    handleUpdateCandidateStatus,
    handleDeleteCandidate
  } = useCandidateOperations(
    createCandidate,
    updateCandidate,
    deleteCandidate,
    selectedCandidate,
    setSelectedCandidate
  );

  const {
    savingResponse,
    submitting: interviewSubmitting,
    deleting: questionDeleting,
    questionSuggestions,
    loadingSuggestions,
    saveRating,
    saveNote,
    submitInterview,
    handleAddQuestion,
    handleEditQuestion,
    handleDeleteQuestion,
    fetchQuestionSuggestions
  } = useInterviewOperations(
    selectedCandidate,
    updateCandidate,
    saveResponse,
    updateResponse,
    setSelectedCandidate,
    addQuestion,
    updateQuestion,
    deleteQuestion
  );

  // Error handling
  useErrorHandler(candidatesError, setCandidatesError);
  useErrorHandler(questionsError, setQuestionsError);
  useErrorHandler(responsesError, setResponsesError);

  // Infinite scroll for candidates
  useInfiniteScroll(loadMoreRef, loadMore, pagination.hasMore, candidatesLoading);

  // Modal body scroll prevention
  const isAnyModalOpen = showViewQuestionsModal || showAddQuestionModal || showEditQuestionModal || showAcceptModal || showRejectModal;
  useModalState(isAnyModalOpen);

  // Load interview details when a candidate is selected
  useEffect(() => {
    if (selectedCandidate && activeStep === 'interview') {
      fetchCandidateInterviewDetails(selectedCandidate.id);
    }
  }, [selectedCandidate, activeStep, fetchCandidateInterviewDetails]);

  // Load interview details when viewing candidate details modal
  useEffect(() => {
    if (showViewQuestionsModal && viewQuestionsCandidate) {
      fetchCandidateInterviewDetails(viewQuestionsCandidate.id);
    }
  }, [showViewQuestionsModal, viewQuestionsCandidate, fetchCandidateInterviewDetails]);

  // Debounce search suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showAddQuestionModal || showEditQuestionModal) {
        const searchText = showAddQuestionModal ? newQuestionText : editingQuestion?.question_text;
        fetchQuestionSuggestions(searchText);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newQuestionText, editingQuestion?.question_text, showAddQuestionModal, showEditQuestionModal, fetchQuestionSuggestions]);

  // Handlers
  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    if (candidate.status === 'pending' || candidate.status === 'interview') setActiveStep('interview');
    else if (candidate.status === 'discussion') setActiveStep('discussion');
    else if (['accepted', 'rejected'].includes(candidate.status)) setActiveStep('final');
  };

  const handleCandidateSubmit = async () => {
    setSubmitAttempted(true);
    const success = await handleCreateCandidate(newCandidate);
    if (success) {
      setNewCandidate({ fullName: '', email: '', phone: '+855', positionAppliedFor: '', interviewDate: '' });
      setSubmitAttempted(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (candidateToDelete) {
      const success = await handleDeleteCandidate(candidateToDelete.id);
      if (success) {
        setShowDeleteModal(false);
        setCandidateToDelete(null);
      }
    }
  };

  const handleConfirmDeleteQuestion = async () => {
    if (deletingQuestion) {
      const success = await handleDeleteQuestion(deletingQuestion.id);
      if (success) {
        setShowDeleteQuestionModal(false);
        setDeletingQuestion(null);
      }
    }
  };

  const handleConfirmAddQuestion = async () => {
    const success = await handleAddQuestion(newQuestionText, addingQuestionCategory);
    if (success) {
      setShowAddQuestionModal(false);
      setNewQuestionText('');
      setAddingQuestionCategory(null);
    }
  };

  const handleConfirmEditQuestion = async (questionId, updatedText) => {
    const success = await handleEditQuestion(questionId, updatedText);
    if (success) {
      setShowEditQuestionModal(false);
      setEditingQuestion(null);
    }
  };

  const handleInterviewSubmit = async () => {
    if (!selectedCandidate) return;
    
    const averageScore = calculateAverageScore(selectedCandidate.id);
    const totalQuestions = Object.values(categories).reduce((total, questions) => total + questions.length, 0);
    const responses = candidateResponses(selectedCandidate.id);
    const ratedQuestions = Object.values(responses).filter(r => r.rating > 0).length;
    const areAllRated = totalQuestions > 0 && totalQuestions === ratedQuestions;
    
    const result = await submitInterview(averageScore, areAllRated);
    if (result?.success && result?.step) {
      setActiveStep(result.step);
    }
  };

  const handleAcceptCandidate = async () => {
    const success = await handleUpdateCandidateStatus(
      selectedCandidate.id,
      'accepted',
      {
        hourlyRate: finalDecision.hourlyRate,
        evaluator: finalDecision.evaluator,
        rateReason: finalDecision.rateReason
      }
    );
    if (success) {
      setShowAcceptModal(false);
      setFinalDecision({ hourlyRate: '', rateReason: '', evaluator: '' });
    }
  };

  const handleRejectCandidate = async () => {
    const success = await handleUpdateCandidateStatus(
      selectedCandidate.id,
      'rejected',
      { rejectionReason }
    );
    if (success) {
      setShowRejectModal(false);
      setRejectionReason('');
    }
  };

  const toggleCategory = (cat) => {
    setOpenCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <RecruitmentHeader 
        candidatesCount={candidates.length}
        onRefresh={refreshCandidates}
        isLoading={candidatesLoading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Main Content */}
          <div className="xl:col-span-3">
            <StepNavigation 
              activeStep={activeStep}
              onStepChange={setActiveStep}
            />

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
              {activeStep === 'add' && (
                <AddCandidateForm
                  candidate={newCandidate}
                  onChange={setNewCandidate}
                  onSubmit={handleCandidateSubmit}
                  isSubmitting={submitting}
                  submitAttempted={submitAttempted}
                />
              )}

              {activeStep === 'interview' && (
                <InterviewEvaluation
                  candidate={selectedCandidate}
                  categories={categories}
                  candidateResponses={candidateResponses}
                  openCategories={openCategories}
                  onToggleCategory={toggleCategory}
                  onSaveRating={saveRating}
                  onSaveNote={saveNote}
                  onSubmitInterview={handleInterviewSubmit}
                  onAddQuestion={(category) => {
                    setAddingQuestionCategory(category);
                    setShowAddQuestionModal(true);
                  }}
                  onEditQuestion={(question) => {
                    setEditingQuestion(question);
                    setShowEditQuestionModal(true);
                  }}
                  onDeleteQuestion={(question) => {
                    setDeletingQuestion(question);
                    setShowDeleteQuestionModal(true);
                  }}
                  onRefreshQuestions={refreshQuestions}
                  isLoading={questionsLoading}
                  isSubmitting={interviewSubmitting}
                  savingResponse={savingResponse}
                />
              )}

              {activeStep === 'discussion' && (
                <DiscussionStep onProceed={() => setActiveStep('final')} />
              )}

              {activeStep === 'final' && (
                <FinalDecisionStep
                  candidate={selectedCandidate}
                  onAccept={() => setShowAcceptModal(true)}
                  onReject={() => setShowRejectModal(true)}
                  isSubmitting={submitting}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1">
            <CandidatesSidebar
              candidates={candidates}
              selectedCandidate={selectedCandidate}
              isLoading={candidatesLoading}
              searchTerm={candidateSearch}
              onSearchChange={setCandidateSearch}
              onSelectCandidate={handleSelectCandidate}
              onViewCandidate={(candidate) => {
                setViewQuestionsCandidate(candidate);
                setShowViewQuestionsModal(true);
              }}
              onDeleteCandidate={(candidate) => {
                setCandidateToDelete(candidate);
                setShowDeleteModal(true);
              }}
              loadMoreRef={loadMoreRef}
              hasMore={pagination.hasMore}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleting}
        title="Delete Candidate"
        message={`Are you sure you want to delete ${candidateToDelete?.fullName}? This action cannot be undone.`}
      />

      <DeleteModal
        isOpen={showDeleteQuestionModal}
        onClose={() => {
          setShowDeleteQuestionModal(false);
          setDeletingQuestion(null);
        }}
        onConfirm={handleConfirmDeleteQuestion}
        isDeleting={questionDeleting}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
      />

      <AcceptCandidateModal
        isOpen={showAcceptModal}
        onClose={() => {
          setShowAcceptModal(false);
          setFinalDecision({ hourlyRate: '', rateReason: '', evaluator: '' });
        }}
        onConfirm={handleAcceptCandidate}
        isSubmitting={submitting}
        candidate={selectedCandidate}
        decision={finalDecision}
        onDecisionChange={setFinalDecision}
      />

      <RejectCandidateModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
        }}
        onConfirm={handleRejectCandidate}
        isSubmitting={submitting}
        candidate={selectedCandidate}
        reason={rejectionReason}
        onReasonChange={setRejectionReason}
      />

      <AddQuestionModal
        isOpen={showAddQuestionModal}
        onClose={() => {
          setShowAddQuestionModal(false);
          setNewQuestionText('');
          setAddingQuestionCategory(null);
        }}
        onConfirm={handleConfirmAddQuestion}
        isSubmitting={submitting}
        category={addingQuestionCategory}
        questionText={newQuestionText}
        onQuestionTextChange={setNewQuestionText}
        suggestions={questionSuggestions}
        loadingSuggestions={loadingSuggestions}
        onSelectSuggestion={(text) => setNewQuestionText(text)}
      />

      <EditQuestionModal
        isOpen={showEditQuestionModal}
        onClose={() => {
          setShowEditQuestionModal(false);
          setEditingQuestion(null);
        }}
        onConfirm={handleConfirmEditQuestion}
        question={editingQuestion}
        onQuestionChange={setEditingQuestion}
        suggestions={questionSuggestions}
        loadingSuggestions={loadingSuggestions}
        onSelectSuggestion={(text) => setEditingQuestion(prev => ({ ...prev, question_text: text }))}
      />

      <ViewCandidateModal
        isOpen={showViewQuestionsModal}
        onClose={() => setShowViewQuestionsModal(false)}
        candidate={viewQuestionsCandidate}
        categories={categories}
        candidateResponses={candidateResponses}
      />
    </div>
  );
}
