import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

/**
 * CourseMappingTable - Displays course mappings in a table with edit/delete actions
 */
export default function CourseMappingTable({ entries, courseMap, onEdit, onDelete }) {
  return (
    <div className="border-t border-gray-200 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500 bg-gray-50">
            <th className="py-3 pl-6 pr-3 font-medium">Course</th>
            <th className="px-3 py-3 font-medium">Lecturer</th>
            <th className="px-3 py-3 font-medium">Theory Groups</th>
            <th className="px-3 py-3 font-medium">Lab Groups</th>
            <th className="px-3 py-3 font-medium">Hours</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((m) => {
            const statusColor =
              m.status === 'Accepted'
                ? 'bg-green-100 text-green-700'
                : m.status === 'Contacting'
                ? 'bg-blue-100 text-blue-700'
                : m.status === 'Rejected'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700';

            const rowKey = String(m.id ?? `${m.class_id}-${m.course_id}-${m.term}-${m.academic_year}`);
            const isTheoryLegacy = /theory|15h/i.test(String(m.type_hours || ''));
            const isLabLegacy = /lab|30h/i.test(String(m.type_hours || ''));
            const theoryGroups = Number.isFinite(m?.theory_groups)
              ? m.theory_groups
              : isTheoryLegacy
              ? m.group_count || 0
              : 0;
            const labGroups = Number.isFinite(m?.lab_groups) ? m.lab_groups : isLabLegacy ? m.group_count || 0 : 0;

            return (
              <tr key={rowKey} className="hover:bg-gray-50">
                <td className="py-3 pl-6 pr-3 text-gray-900 font-medium whitespace-nowrap">
                  {m.course?.course_name ||
                    courseMap[m.course_id]?.course_name ||
                    m.course?.course_code ||
                    courseMap[m.course_id]?.course_code ||
                    m.course_id}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {m.lecturer?.name || <span className="italic text-gray-400">Not assigned</span>}
                </td>
                <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{theoryGroups ?? 0}</td>
                <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{labGroups ?? 0}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {theoryGroups > 0 && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Theory{' '}
                        {m.theory_hours || (String(m.type_hours || '').includes('15h') ? '15h' : '30h')} ×{' '}
                        {theoryGroups}
                      </span>
                    )}
                    {labGroups > 0 && (
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                        Lab 30h × {labGroups}
                      </span>
                    )}
                    {theoryGroups === 0 && labGroups === 0 && (
                      <>
                        {m.type_hours ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {m.type_hours}
                          </span>
                        ) : (
                          <span className="italic text-gray-400">not yet</span>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(m)}
                      title="Edit"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(m)}
                      title="Delete"
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-red-300 bg-white text-red-600 hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
