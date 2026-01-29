import React from 'react';
import { Eye, XCircle, Mail, Phone, GraduationCap, Calendar, Star, MessageCircle } from 'lucide-react';
import { formatDate, getStatusColor, ratingColorClass } from '../../../utils/recruitmentHelpers';

export default function ViewCandidateModal({
  isOpen,
  onClose,
  candidate,
  categories,
  candidateResponses
}) {
  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-white/60 w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="p-6 border-b border-slate-200/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                Candidate Details
              </h3>
              <p className="text-slate-600 mt-1">{candidate.fullName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">Email:</span>
                <span className="font-medium">{candidate.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">Phone:</span>
                <span className="font-medium">{candidate.phone}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">Position:</span>
                <span className="font-medium">{candidate.positionAppliedFor}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">Interview:</span>
                <span className="font-medium">
                  {candidate.interviewDate ? formatDate(candidate.interviewDate) : 'Not scheduled'}
                </span>
              </div>
            </div>
          </div>
          
          {candidate.interviewScore ? (
            <div>
              {/* Interview Score Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Interview Score</h4>
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl font-bold px-4 py-2 rounded-xl border ${ratingColorClass(candidate.interviewScore)}`}>
                        {Number(candidate.interviewScore).toFixed(1)} / 5.0
                      </span>
                      <span className={`px-3 py-1 rounded-lg border font-semibold text-sm ${getStatusColor(candidate.status)}`}>
                        {candidate.status}
                      </span>
                    </div>
                  </div>
                  <Star className="w-12 h-12 text-amber-500" />
                </div>
              </div>

              {/* Interview Responses */}
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-slate-900">Interview Responses</h4>
                {Object.entries(categories).map(([catName, questions]) => {
                  const responses = candidateResponses(candidate.id);
                  const categoryQuestions = questions.filter(q => responses[q.id]);
                  
                  if (categoryQuestions.length === 0) return null;
                  
                  return (
                    <div key={catName} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                        <h5 className="font-bold text-slate-900">{catName}</h5>
                      </div>
                      <div className="p-6 space-y-4">
                        {categoryQuestions.map((question) => {
                          const response = responses[question.id];
                          return (
                            <div key={question.id} className="pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                              <p className="text-slate-700 font-medium mb-3">{question.question_text}</p>
                              <div className="flex items-center gap-4 mb-2">
                                <span className="text-sm text-slate-600">Rating:</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={`w-4 h-4 ${
                                        star <= (response?.rating || 0) 
                                          ? 'text-amber-400 fill-current' 
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-semibold text-slate-700">
                                  {response?.rating || 0} / 5
                                </span>
                              </div>
                              {response?.notes && (
                                <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                                  <p className="text-sm text-slate-600">
                                    <span className="font-semibold">Notes:</span> {response.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No interview data available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
