import React from 'react';
import { Calendar, Star, DollarSign, Eye, Trash2 } from 'lucide-react';
import { formatDate, getStatusColor, getStatusIconComponent, ratingColorClass } from '../../../utils/recruitmentHelpers';

export default function CandidateCard({ 
  candidate, 
  isSelected, 
  onClick,
  onView,
  onDelete
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg group relative ${
        isSelected 
          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg shadow-blue-500/20' 
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all duration-200 shadow-sm"
          title="View details"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all duration-200 shadow-sm"
          title="Delete candidate"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mb-3 pr-20">
        <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
          {candidate.fullName}
        </h4>
        <p className="text-xs text-slate-600 mb-2">{candidate.positionAppliedFor}</p>
        
        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(candidate.status)}`}>
          {React.createElement(getStatusIconComponent(candidate.status), { className: "w-3.5 h-3.5" })}
          <span className="capitalize">{candidate.status}</span>
        </div>
      </div>

      {/* Interview Details */}
      <div className="space-y-2">
        {candidate.interviewDate && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(candidate.interviewDate)}</span>
          </div>
        )}
        
        {candidate.interviewScore && (
          <div className="flex items-center gap-2 text-xs">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-600">Score:</span>
            <span className={`px-2 py-1 rounded-md font-semibold ${ratingColorClass(candidate.interviewScore)}`}>
              {Number(candidate.interviewScore).toFixed(1)}/5.0
            </span>
          </div>
        )}

        {candidate.hourlyRate && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <DollarSign className="w-3.5 h-3.5" />
            <span>${candidate.hourlyRate}/hour</span>
          </div>
        )}
      </div>
    </div>
  );
}
