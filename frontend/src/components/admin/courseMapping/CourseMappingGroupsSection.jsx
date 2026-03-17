import React from 'react';
import { GraduationCap } from 'lucide-react';
import ClassGroupCard from './ClassGroupCard.jsx';

export default function CourseMappingGroupsSection({ error, grouped, loading, termFilter, statusFilter, academicYearFilter, sentinelRef, hasMore, courseMap, startEdit, setToDelete, setConfirmOpen }) {
  return (
    <div className="space-y-8">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold">Error loading data:</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : null}
      {grouped.map((group) => (
        <ClassGroupCard
          key={group.key}
          group={group}
          courseMap={courseMap}
          onEdit={startEdit}
          onDelete={(mapping) => {
            setToDelete(mapping);
            setConfirmOpen(true);
          }}
        />
      ))}
      {!grouped.length && !loading && !error ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-4"><GraduationCap className="h-16 w-16 mx-auto" /></div>
          <p className="text-gray-700 font-semibold mb-2">No course mappings found</p>
          <p className="text-sm text-gray-500 mb-4">
            {academicYearFilter !== 'ALL' || termFilter !== 'ALL' || statusFilter !== 'ALL' ? 'Try adjusting your filters or add a new course assignment.' : 'Get started by adding your first course assignment.'}
          </p>
        </div>
      ) : null}
      {grouped.length > 0 ? (
        <div ref={sentinelRef} className="h-10 flex items-center justify-center text-xs text-gray-400">
          {loading ? 'Loading more...' : hasMore ? 'Scroll to load more' : 'All data loaded'}
        </div>
      ) : null}
    </div>
  );
}