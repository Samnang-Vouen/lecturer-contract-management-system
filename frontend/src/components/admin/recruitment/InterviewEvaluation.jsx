import React from 'react';
import { GraduationCap, CheckCircle, Star, AlertCircle, Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import StarRating from './StarRating';
import LoadingSpinner from './LoadingSpinner';
import { ratingColorClass } from '../../../utils/recruitmentHelpers';

export default function InterviewEvaluation({
  candidate,
  categories,
  candidateResponses,
  openCategories,
  onToggleCategory,
  onSaveRating,
  onSaveNote,
  onSubmitInterview,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onRefreshQuestions,
  isLoading,
  isSubmitting,
  savingResponse
}) {
  if (!candidate) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Interview Evaluation</h2>
            <p className="text-slate-600 mt-1">Select a candidate to begin evaluation</p>
          </div>
        </div>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Select a Candidate</h3>
          <p className="text-slate-600 max-w-md mx-auto">Choose a candidate from the sidebar to start the interview evaluation process.</p>
        </div>
      </div>
    );
  }

  if (candidate.status !== 'pending') {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Interview Evaluation</h2>
            <p className="text-slate-600 mt-1">Evaluating: {candidate.fullName}</p>
          </div>
        </div>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Interview Completed</h3>
          <p className="text-slate-600 max-w-md mx-auto mb-6">
            The interview for <span className="font-semibold">{candidate.fullName}</span> has been submitted.
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 p-8 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-4">
              <Star className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-sm text-slate-600 mb-1">Final Interview Score</p>
                <span className={`text-3xl font-bold px-4 py-2 rounded-xl border inline-block ${ratingColorClass(candidate.interviewScore || 0)}`}>
                  {Number(candidate.interviewScore || 0).toFixed(1)} / 5.0
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-6">
            Click the eye icon on the candidate card to view detailed interview responses.
          </p>
        </div>
      </div>
    );
  }

  const getTotalQuestionsCount = () => {
    return Object.values(categories).reduce((total, questions) => total + questions.length, 0);
  };

  const getRatedQuestionsCount = () => {
    const responses = candidateResponses(candidate.id);
    return Object.values(responses).filter(r => r.rating > 0).length;
  };

  const areAllQuestionsRated = () => {
    const total = getTotalQuestionsCount();
    const rated = getRatedQuestionsCount();
    return total > 0 && total === rated;
  };

  const getCurrentAverageScore = () => {
    const responses = candidateResponses(candidate.id);
    const ratings = Object.values(responses).filter(r => r.rating > 0).map(r => r.rating);
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Interview Evaluation</h2>
          <p className="text-slate-600 mt-1">Evaluating: {candidate.fullName}</p>
        </div>
        {isLoading && (
          <div className="ml-auto">
            <LoadingSpinner />
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Score Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Overall Score</h3>
              <div className="flex items-center gap-4 mb-3">
                <span className={`px-4 py-2 rounded-xl border font-bold ${ratingColorClass(getCurrentAverageScore())}`}>
                  {getCurrentAverageScore().toFixed(1)} / 5.0
                </span>
                <span className="text-sm text-slate-600">Real-time average</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getTotalQuestionsCount() > 0 ? (getRatedQuestionsCount() / getTotalQuestionsCount()) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700 min-w-[80px]">
                  {getRatedQuestionsCount()} / {getTotalQuestionsCount()}
                </span>
              </div>
              {!areAllQuestionsRated() && getTotalQuestionsCount() > 0 && (
                <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Please rate all questions before submitting
                </p>
              )}
            </div>
            <button
              onClick={onSubmitInterview}
              disabled={!areAllQuestionsRated() || isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? <LoadingSpinner /> : null}
              {isSubmitting ? 'Submitting...' : 'Submit Interview'}
            </button>
          </div>
        </div>

        {/* Interview Questions */}
        {Object.keys(categories).length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-3">No Questions Available</h3>
            <p className="text-slate-600 max-w-md mx-auto">No interview questions have been configured yet.</p>
            <button
              onClick={onRefreshQuestions}
              className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Refresh Questions
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(categories).map(([catName, questions]) => {
              const isOpen = openCategories.includes(catName);
              return (
                <div key={catName} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between p-6">
                    <button
                      onClick={() => onToggleCategory(catName)}
                      className="flex-1 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors rounded-xl -m-3 p-3"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{catName}</h3>
                        <p className="text-sm text-slate-600 mt-1">{questions.length} questions</p>
                      </div>
                      <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      onClick={() => onAddQuestion(catName)}
                      className="ml-3 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                      title="Add question to this category"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                  </div>
                  
                  {isOpen && (
                    <div className="px-6 pb-6 space-y-6">
                      {questions.map(question => {
                        const response = candidateResponses(candidate.id)[question.id] || {};
                        const currentRating = response.rating || 0;
                        const currentNote = response.noted || '';
                        
                        return (
                          <div key={question.id} className="bg-white rounded-xl border border-slate-200/50 p-6 shadow-sm group hover:border-slate-300 transition-all">
                            <div className="flex items-start justify-between mb-6">
                              <p className="text-slate-900 font-medium flex-1 pr-4">{question.question_text}</p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => onEditQuestion(question)}
                                  className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all duration-200 opacity-0 group-hover:opacity-100"
                                  title="Edit question"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteQuestion(question)}
                                  className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100"
                                  title="Delete question"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Rating */}
                            <div className="mb-6">
                              <label className="text-sm font-semibold text-slate-700 mb-3 block">
                                Rating <span className="text-red-500">*</span>
                              </label>
                              <StarRating 
                                rating={currentRating} 
                                onRatingChange={(rating) => onSaveRating(question.id, rating)}
                                disabled={savingResponse}
                              />
                              {currentRating === 0 && (
                                <p className="text-amber-600 text-xs mt-2 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Rating required
                                </p>
                              )}
                            </div>
                            
                            {/* Notes */}
                            <div>
                              <label className="text-sm font-semibold text-slate-700 mb-3 block">
                                Notes <span className="text-slate-400 text-xs">(Optional)</span>
                              </label>
                              <textarea
                                rows={3}
                                value={currentNote}
                                onChange={(e) => onSaveNote(question.id, e.target.value)}
                                placeholder="Add your evaluation notes..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 bg-white resize-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
