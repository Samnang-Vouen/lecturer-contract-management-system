import React from 'react';
import { Search, User } from 'lucide-react';
import CandidateCard from './CandidateCard';
import LoadingSpinner from './LoadingSpinner';

export default function CandidatesSidebar({ 
  candidates,
  selectedCandidate,
  isLoading,
  searchTerm,
  onSearchChange,
  onSelectCandidate,
  onViewCandidate,
  onDeleteCandidate,
  loadMoreRef,
  hasMore
}) {
  const filteredCandidates = candidates.filter(candidate => 
    !searchTerm || 
    candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.positionAppliedFor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 sticky top-32">
      <div className="p-6 border-b border-slate-200/50">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Candidates</h3>
        
        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search candidates..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 bg-white text-sm"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200/50">
            <div className="text-lg font-bold text-blue-900">
              {candidates.filter(c => c.status === 'accepted').length}
            </div>
            <div className="text-xs text-blue-700">Accepted</div>
          </div>
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-3 border border-amber-200/50">
            <div className="text-lg font-bold text-amber-900">
              {candidates.filter(c => ['pending', 'interview'].includes(c.status)).length}
            </div>
            <div className="text-xs text-amber-700">Pending</div>
          </div>
        </div>
      </div>

      <div className="p-6 max-h-[calc(100vh-400px)] overflow-y-auto">
        {isLoading && candidates.length === 0 ? (
          <div className="text-center py-8">
            <LoadingSpinner size="w-8 h-8" />
            <p className="text-slate-600 text-sm mt-3">Loading candidates...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCandidates.map(candidate => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedCandidate?.id === candidate.id}
                onClick={() => onSelectCandidate(candidate)}
                onView={() => onViewCandidate(candidate)}
                onDelete={() => onDeleteCandidate(candidate)}
              />
            ))}
            
            {/* Load More Trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="text-center py-4">
                <LoadingSpinner />
                <p className="text-sm text-slate-600 mt-2">Loading more candidates...</p>
              </div>
            )}
          </div>
        )}
        
        {!isLoading && filteredCandidates.length === 0 && (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 text-sm">
              {searchTerm ? 'No candidates found matching your search' : 'No candidates found'}
            </p>
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="mt-2 text-blue-600 text-sm hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
