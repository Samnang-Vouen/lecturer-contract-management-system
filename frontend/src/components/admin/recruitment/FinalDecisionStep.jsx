import React from 'react';
import { DollarSign, User, GraduationCap, Star, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getStatusColor, getStatusIconComponent, ratingColorClass } from '../../../utils/recruitmentHelpers';

export default function FinalDecisionStep({ 
  candidate, 
  onAccept, 
  onReject,
  isSubmitting 
}) {
  if (!candidate) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Final Decision</h2>
            <p className="text-slate-600 mt-1">Select candidate for final decision</p>
          </div>
        </div>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <DollarSign className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Select a Candidate</h3>
          <p className="text-slate-600 max-w-md mx-auto">Choose a candidate from the sidebar to make the final hiring decision.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Final Decision</h2>
          <p className="text-slate-600 mt-1">Decision for: {candidate.fullName}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Candidate Summary */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200/50 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Candidate Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">Name:</span>
                <span className="font-semibold text-slate-900">{candidate.fullName}</span>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">Position:</span>
                <span className="font-semibold text-slate-900">{candidate.positionAppliedFor}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">Score:</span>
                <span className={`px-3 py-1 rounded-lg border font-bold ${ratingColorClass(candidate.interviewScore || 0)}`}>
                  {Number(candidate.interviewScore || 0).toFixed(1)} / 5.0
                </span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">Status:</span>
                <span className={`px-3 py-1 rounded-lg border font-semibold text-xs flex items-center gap-2 ${getStatusColor(candidate.status)}`}>
                  {React.createElement(getStatusIconComponent(candidate.status), { className: "w-3.5 h-3.5" })}
                  {candidate.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Conditional rendering based on score and status */}
        {candidate.interviewScore < 2.5 ? (
          /* Auto-rejected candidate - Read-only view */
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl border border-red-200/50 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Candidate Auto-Rejected</h3>
              <p className="text-slate-600">
                This candidate was automatically rejected due to an interview score below 2.5
              </p>
            </div>
            
            {candidate.rejectionReason && (
              <div className="bg-white rounded-xl border border-red-200 p-6">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Rejection Reason
                </h4>
                <p className="text-slate-700 leading-relaxed">{candidate.rejectionReason}</p>
              </div>
            )}
          </div>
        ) : candidate.status === 'accepted' ? (
          /* Accepted candidate - Read-only view */
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200/50 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Candidate Accepted</h3>
              <p className="text-slate-600">
                This candidate has been accepted for the position
              </p>
            </div>
            
            <div className="space-y-4">
              {candidate.hourlyRate && (
                <div className="bg-white rounded-xl border border-emerald-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Hourly Rate
                  </h4>
                  <p className="text-2xl font-bold text-emerald-600">${candidate.hourlyRate}/hour</p>
                </div>
              )}
              
              {candidate.evaluator && (
                <div className="bg-white rounded-xl border border-emerald-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    Evaluator
                  </h4>
                  <p className="text-slate-700">{candidate.evaluator}</p>
                </div>
              )}
              
              {candidate.rateReason && (
                <div className="bg-white rounded-xl border border-emerald-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-emerald-600" />
                    Reason for Rate
                  </h4>
                  <p className="text-slate-700 leading-relaxed">{candidate.rateReason}</p>
                </div>
              )}
            </div>
          </div>
        ) : candidate.status === 'rejected' ? (
          /* Manually rejected candidate - Read-only view */
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl border border-red-200/50 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Candidate Rejected</h3>
              <p className="text-slate-600">
                This candidate has been rejected
              </p>
            </div>
            
            {candidate.rejectionReason && (
              <div className="bg-white rounded-xl border border-red-200 p-6">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Rejection Reason
                </h4>
                <p className="text-slate-700 leading-relaxed">{candidate.rejectionReason}</p>
              </div>
            )}
          </div>
        ) : (
          /* Score >= 2.5 and not yet decided - Show action buttons */
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Make Your Decision</h3>
              <p className="text-slate-600 mb-6">
                This candidate has passed the interview threshold. Choose to accept or reject this candidate.
              </p>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={onReject}
                  disabled={isSubmitting}
                  className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-red-500 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Candidate
                </button>
                <button
                  onClick={onAccept}
                  disabled={isSubmitting}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Accept Candidate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
