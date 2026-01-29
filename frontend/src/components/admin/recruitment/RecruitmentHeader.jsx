import React from 'react';
import { RefreshCw } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function RecruitmentHeader({ 
  candidatesCount, 
  onRefresh, 
  isLoading 
}) {
  return (
    <div className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Recruitment Management
            </h1>
            <p className="text-slate-600 mt-2 font-medium">Streamlined lecturer hiring process</p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">{candidatesCount}</div>
              <div className="text-sm text-slate-600">Total Candidates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
