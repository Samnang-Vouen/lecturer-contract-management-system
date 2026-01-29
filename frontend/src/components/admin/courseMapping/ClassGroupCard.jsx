import React from 'react';
import { Users, AlertTriangle, CheckCircle } from 'lucide-react';
import CourseMappingTable from './CourseMappingTable.jsx';

/**
 * ClassGroupCard - Displays a class group with its course mappings
 */
export default function ClassGroupCard({ group, courseMap, onEdit, onDelete }) {
  const { key, class: classData, entries, stats } = group;
  const completion = stats.total ? Math.round((stats.assigned / stats.total) * 100) : 0;
  const academicYear = classData?.academic_year || entries[0]?.academic_year;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 pt-5 pb-4 flex flex-col gap-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-blue-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-gray-900 text-lg">
                  {classData?.name || 'Class'}{' '}
                  {classData?.term && <span className="text-gray-500 font-normal">{classData.term}</span>}{' '}
                  {classData?.year_level && (
                    <span className="text-gray-500 font-normal">
                      Year{' '}
                      {typeof classData.year_level === 'string'
                        ? classData.year_level.replace(/[^0-9]/g, '') || classData.year_level
                        : classData.year_level}
                    </span>
                  )}
                </h2>
                {academicYear && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {academicYear}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {stats.assigned} of {stats.total} course{stats.total !== 1 && 's'} assigned •{' '}
                {stats.hoursAssigned}h of {stats.hoursNeeded}h covered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {stats.pending > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-red-50 text-red-700 text-xs font-medium px-2 py-1">
                <AlertTriangle className="h-3 w-3" /> {stats.pending} Pending
              </span>
            )}
            {stats.pending === 0 && stats.total > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-green-50 text-green-700 text-xs font-medium px-2 py-1">
                <CheckCircle className="h-3 w-3" /> Complete
              </span>
            )}
            {stats.pending > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-red-600 text-white text-xs font-medium px-2 py-1">
                Needs Attention
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Course Assignment Progress</span>
            <span>{completion}%</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-900 transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      <CourseMappingTable entries={entries} courseMap={courseMap} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
