import React from 'react';
import { User, Mail, Phone, GraduationCap, Calendar, Plus, ChevronDown } from 'lucide-react';
import {
  formatFullNameInput,
  formatPhoneInput,
  fromDateTimeLocalToPhnomPenhISO,
  hasAtSign,
  isE164,
  toPhnomPenhDateTimeLocal,
} from '../../../utils/recruitmentHelpers';
import LoadingSpinner from './LoadingSpinner';

export default function AddCandidateForm({
  candidate,
  onChange,
  onSubmit,
  isSubmitting,
  submitAttempted
}) {
  const allFilled =
    ['fullName', 'email', 'phone', 'positionAppliedFor', 'interviewDate'].every(
      (k) => String(candidate[k] || '').trim() !== ''
    ) &&
    hasAtSign(candidate.email) &&
    isE164(candidate.phone);

  const interviewDateLocalValue = toPhnomPenhDateTimeLocal(candidate.interviewDate);

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
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={candidate.fullName}
              onChange={(e) => onChange({ ...candidate, fullName: e.target.value })}
              onBlur={(e) =>
                onChange({ ...candidate, fullName: formatFullNameInput(e.target.value) })
              }
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
              Email Address <span className="text-red-500">*</span>
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
            {submitAttempted && candidate.email && !hasAtSign(candidate.email) && (
              <p className="text-red-500 text-sm">Email must contain @</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Phone className="w-4 h-4" />
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={candidate.phone}
              onChange={(e) =>
                onChange({ ...candidate, phone: formatPhoneInput(e.target.value) })
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 bg-white"
              placeholder="+855 123 456 789"
            />
            {submitAttempted && !isE164(candidate.phone) && (
              <p className="text-red-500 text-sm">Valid phone number is required</p>
            )}
          </div>

          {/* Position */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <GraduationCap className="w-4 h-4" />
              Position Applied For <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={candidate.positionAppliedFor}
                onChange={(e) => onChange({ ...candidate, positionAppliedFor: e.target.value })}
                className="w-full cursor-pointer appearance-none px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 bg-white"
              >
                <option value="">Select Position</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Advisor">Advisor</option>
                <option value="Assistant Lecturer">Assistant Lecturer</option>
                {/* <option value="Senior Lecturer">Senior Lecturer</option>
                <option value="Professor">Professor</option> */}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            </div>
            {submitAttempted && !candidate.positionAppliedFor && (
              <p className="text-red-500 text-sm">Position is required</p>
            )}
          </div>

          {/* Interview Date */}
          <div className="space-y-3 lg:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Calendar className="w-4 h-4" />
              Interview Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={interviewDateLocalValue}
              onFocus={(e) => e.currentTarget.showPicker?.()}
              onClick={(e) => e.currentTarget.showPicker?.()}
              onChange={(e) =>
                onChange({
                  ...candidate,
                  interviewDate: fromDateTimeLocalToPhnomPenhISO(e.target.value),
                })
              }
              className="w-full cursor-pointer px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 bg-white"
            />
            {submitAttempted && !candidate.interviewDate && (
              <p className="text-red-500 text-sm">Interview date is required</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-200/50">
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !allFilled}
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
