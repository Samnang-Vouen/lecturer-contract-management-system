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
                  <tr key={m._key || m.id} className='hover:bg-gray-50'>
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
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200'>
                          In Progress
                        </span>
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
                      {(() => {
                        const names = Array.isArray(m.theory_group_names)
                          ? m.theory_group_names.map((x) => String(x || '').trim()).filter(Boolean)
                          : [];
                        const items = names.length ? Array.from(new Set(names)) : ['None'];
                        return (
                          <div className='flex flex-wrap gap-1.5'>
                            {items.map((name, idx) => (
                              <span
                                key={`${name}-${idx}`}
                                title={name}
                                className={
                                  name === 'None'
                                    ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200'
                                    : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200'
                                }
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </td>
                    <td className='py-3 pr-6'>
                      {(() => {
                        const names = Array.isArray(m.lab_group_names)
                          ? m.lab_group_names.map((x) => String(x || '').trim()).filter(Boolean)
                          : [];
                        const items = names.length ? Array.from(new Set(names)) : ['None'];
                        return (
                          <div className='flex flex-wrap gap-1.5'>
                            {items.map((name, idx) => (
                              <span
                                key={`${name}-${idx}`}
                                title={name}
                                className={
                                  name === 'None'
                                    ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200'
                                    : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200'
                                }
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </td>
                    <td className='py-3 pr-6 text-gray-800 whitespace-nowrap'>
                      {(() => {
                        const backendMappingTotal = Number.isFinite(+m.mapping_total_hours) ? +m.mapping_total_hours : null;
                        let total = backendMappingTotal;
                        let breakdownTitle = '';
                        if (total == null) {
                          const { theoryTotal, labTotal } = computeTotalHours(m);
                          const hasAny = theoryTotal != null || labTotal != null;
                          if (!hasAny) return <span className='text-gray-400'>-</span>;
                          const parts = [];
                          if (theoryTotal != null) parts.push(`Theory ${theoryTotal}h`);
                          if (labTotal != null) parts.push(`Lab ${labTotal}h`);
                          breakdownTitle = parts.join(' + ');
                          total = 0;
                          if (theoryTotal != null) total += theoryTotal;
                          if (labTotal != null) total += labTotal;
                        }
                        if (!Number.isFinite(total) || total <= 0) {
                          return (
                            <span className='inline-flex items-center justify-center min-w-[3.75rem] px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200'>
                              —
                            </span>
                          );
                        }
                        return (
                          <span
                            title={breakdownTitle || undefined}
                            className='inline-flex items-center justify-center min-w-[3.75rem] px-3 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-sky-50 text-sky-700 border border-sky-200'
                          >
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
