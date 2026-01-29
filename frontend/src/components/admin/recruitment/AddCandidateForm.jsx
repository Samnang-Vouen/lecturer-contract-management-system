import React from 'react';
import { User, Mail, Phone, GraduationCap, Calendar, Plus } from 'lucide-react';
import { isE164 } from '../../../utils/recruitmentHelpers';
import LoadingSpinner from './LoadingSpinner';

export default function AddCandidateForm({
  candidate,
  onChange,
  onSubmit,
  isSubmitting,
  submitAttempted
}) {
  const allFilled = ['fullName', 'email', 'phone', 'positionAppliedFor', 'interviewDate']
    .every((k) => String(candidate[k] || '').trim() !== '') && isE164(candidate.phone);

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Add New Candidate</h2>
          <p className="text-slate-600 mt-1">Enter candidate information to begin the recruitment process</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User className="w-4 h-4" />
              Full Name
            </label>
            <input
              type="text"
              value={candidate.fullName}
              onChange={(e) => onChange({ ...candidate, fullName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 bg-white"
              placeholder="John Smith"
            />
            {submitAttempted && !candidate.fullName && (
              <p className="text-red-500 text-sm">Full name is required</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <input
              type="email"
              value={candidate.email}
              onChange={(e) => onChange({ ...candidate, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 bg-white"
              placeholder="john.smith@email.com"
            />
            {submitAttempted && !candidate.email && (
              <p className="text-red-500 text-sm">Email is required</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            <input
              type="tel"
              value={candidate.phone}
              onChange={(e) => onChange({ ...candidate, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 bg-white"
              placeholder="+855 12 345 678"
            />
            {submitAttempted && !isE164(candidate.phone) && (
              <p className="text-red-500 text-sm">Valid phone number is required</p>
            )}
          </div>

          {/* Position */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <GraduationCap className="w-4 h-4" />
              Position Applied For
            </label>
            <select
              value={candidate.positionAppliedFor}
              onChange={(e) => onChange({ ...candidate, positionAppliedFor: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 bg-white"
            >
              <option value="">Select Position</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Assistant Lecturer">Assistant Lecturer</option>
              <option value="Senior Lecturer">Senior Lecturer</option>
              <option value="Professor">Professor</option>
            </select>
            {submitAttempted && !candidate.positionAppliedFor && (
              <p className="text-red-500 text-sm">Position is required</p>
            )}
          </div>

          {/* Interview Date */}
          <div className="space-y-3 lg:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Calendar className="w-4 h-4" />
              Interview Date & Time
            </label>
            <input
              type="datetime-local"
              value={candidate.interviewDate}
              onChange={(e) => onChange({ ...candidate, interviewDate: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 bg-white"
            />
            {submitAttempted && !candidate.interviewDate && (
              <p className="text-red-500 text-sm">Interview date is required</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-200/50">
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <LoadingSpinner /> : <Plus className="w-5 h-5" />}
            {isSubmitting ? 'Adding...' : 'Add Candidate'}
          </button>
        </div>
      </div>
    </div>
  );
}
