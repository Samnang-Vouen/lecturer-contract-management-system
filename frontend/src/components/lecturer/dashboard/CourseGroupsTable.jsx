import React from 'react';
import { BookOpen } from 'lucide-react';
import { formatTerm, formatYearLevel, computeTotalHours } from '../../../utils/lecturerDashboard.utils';

export const CourseGroupsTable = ({ courseMappings }) => {
  return (
    <div className='mb-8'>
      <div className='bg-white p-5 rounded-xl shadow-sm border border-gray-200'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-2 bg-blue-100 rounded-lg'>
            <BookOpen className='w-5 h-5 text-blue-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>Assigned Course Groups</h3>
            <p className='text-sm text-gray-600'>Course • Theory Groups • Lab Groups • Hours</p>
          </div>
        </div>
        {(courseMappings || []).length ? (
          <div className='overflow-x-auto'>
            <table className='min-w-full text-sm'>
              <thead>
                <tr className='text-left text-gray-600 sticky top-0 bg-white z-10 border-b border-gray-100'>
                  <th className='py-3 pr-6 text-xs font-semibold uppercase tracking-wide text-gray-500'>Course</th>
                  <th className='py-3 pr-6 text-xs font-semibold uppercase tracking-wide text-gray-500'>Academic Year</th>
                  <th className='py-3 pr-6 text-xs font-semibold uppercase tracking-wide text-gray-500'>Contract End Date</th>
                  <th className='py-3 pr-6 text-xs font-semibold uppercase tracking-wide text-gray-500'>Term</th>
                  <th className='py-3 pr-6 text-xs font-semibold uppercase tracking-wide text-gray-500'>Year Level</th>
                  <th className='py-3 pr-6 text-xs font-semibold uppercase tracking-wide text-gray-500'>Theory Groups</th>
                  <th className='py-3 pr-6 text-xs font-semibold uppercase tracking-wide text-gray-500'>Lab Groups</th>
                  <th className='py-3 pr-6 text-xs font-semibold uppercase tracking-wide text-gray-500'>Hours</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {courseMappings.map((m) => (
                  <tr key={m.id} className='hover:bg-gray-50'>
                    <td className='py-3 pr-6 text-gray-900 font-medium'>{m.course_name}</td>
                    <td className='py-3 pr-6 whitespace-nowrap'>
                      {m.academic_year ? (
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200'>
                          {m.academic_year}
                        </span>
                      ) : (
                        <span className='text-gray-400'>-</span>
                      )}
                    </td>
                    <td className='py-3 pr-6 whitespace-nowrap'>
                      {m.contract_end_date ? (
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-md text-xs bg-teal-50 text-teal-700 border border-teal-200'>
                          {new Date(m.contract_end_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className='text-gray-400'>-</span>
                      )}
                    </td>
                    <td className='py-3 pr-6 whitespace-nowrap'>
                      {m.term ? (
                        <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200'>
                          {formatTerm(m.term)}
                        </span>
                      ) : (
                        <span className='text-gray-400'>-</span>
                      )}
                    </td>
                    <td className='py-3 pr-6 whitespace-nowrap'>
                      {m.year_level !== null && m.year_level !== undefined && m.year_level !== '' ? (
                        <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'>
                          {formatYearLevel(m.year_level)}
                        </span>
                      ) : (
                        <span className='text-gray-400'>-</span>
                      )}
                    </td>
                    <td className='py-3 pr-6'>
                      <span className='inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200'>
                        {m.theory_groups ?? 0}
                      </span>
                    </td>
                    <td className='py-3 pr-6'>
                      <span className='inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200'>
                        {m.lab_groups ?? 0}
                      </span>
                    </td>
                    <td className='py-3 pr-6 text-gray-800 whitespace-nowrap'>
                      {(() => {
                        const backendTotal = Number.isFinite(+m.contract_total_hours) ? +m.contract_total_hours : null;
                        let total = backendTotal;
                        if (total == null) {
                          const { theoryTotal, labTotal } = computeTotalHours(m);
                          const hasAny = theoryTotal != null || labTotal != null;
                          if (!hasAny) return <span className='text-gray-400'>-</span>;
                          total = 0;
                          if (theoryTotal != null) total += theoryTotal;
                          if (labTotal != null) total += labTotal;
                        }
                        if (!Number.isFinite(total) || total <= 0) return <span className='text-gray-400'>-</span>;
                        return (
                          <span className='inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200'>
                            {`${total}h`}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='text-gray-500'>No assigned course groups.</div>
        )}
      </div>
    </div>
  );
};
