import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import {
  formatMDY,
  formatContractId,
  calculateTotalHours,
  toPositiveNumber,
  getDisplayStatus,
  getStatusLabel,
} from '../../../utils/lecturerContractHelpers';

/**
 * ContractViewDialog Component
 * Dialog for viewing contract details
 */
export default function ContractViewDialog({ 
  isOpen, 
  onClose, 
  contract,
  hourlyRate
}) {
  if (!contract) return null;

  const isAdvisor = String(contract?.contract_type || '').toUpperCase() === 'ADVISOR';

  const formattedId = formatContractId(contract);
  const totalHours = calculateTotalHours(contract);
  const rate =
    toPositiveNumber(contract?.hourly_rate) ??
    toPositiveNumber(contract?.hourlyRateThisYear) ??
    toPositiveNumber(contract?.hourlyRate) ??
    toPositiveNumber(hourlyRate);
  const totalValue = rate != null ? Math.round(rate * totalHours) : null;

  const displayStatus = getDisplayStatus(contract);
  const statusDisplay = getStatusLabel(displayStatus);

  const responsibilities = isAdvisor
    ? [
        contract?.capstone_1 ? 'Capstone I' : null,
        contract?.capstone_2 ? 'Capstone II' : null,
        contract?.internship_1 ? 'Internship I' : null,
        contract?.internship_2 ? 'Internship II' : null,
      ].filter(Boolean)
    : [];

  const students = Array.isArray(contract?.students) ? contract.students : [];
  const duties = Array.isArray(contract?.duties) ? contract.duties : [];

  const hoursPerStudent = Number(contract?.hours_per_student ?? contract?.hoursPerStudent ?? 0) || 0;
  const joinJudgingHours = Number(
    contract?.join_judging_hours ??
      contract?.joinJudgingHours ??
      contract?.join_judging_hour ??
      contract?.joinJudgingHour ??
      0
  ) || 0;

  const roleLabel = (() => {
    const r = String(contract?.role || '').toUpperCase();
    if (r === 'ADVISOR') return 'Advisor';
    if (r === 'LECTURE') return 'Lecture';
    return contract?.role || '—';
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Contract Detail</DialogTitle>
              <DialogDescription>{formattedId}</DialogDescription>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Lecturer</div>
                <div className="font-medium text-gray-900 truncate" title={contract.lecturer?.LecturerProfile?.full_name_english || contract.lecturer?.display_name || 'Unknown'}>
                  {contract.lecturer?.LecturerProfile?.full_name_english ||
                    contract.lecturer?.display_name ||
                    'Unknown'}
                </div>
                <div className="text-gray-600 truncate" title={contract.lecturer?.email || '-'}>
                  {contract.lecturer?.email || '-'}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${statusDisplay.class}`}
                >
                  {statusDisplay.icon && <statusDisplay.icon className="w-3.5 h-3.5" />}
                  {statusDisplay.label}
                </span>
              </div>
              <div>
                <div className="text-gray-500">Period</div>
                <div className="text-gray-900">
                  {formatMDY(contract.start_date) || '—'} to {formatMDY(contract.end_date) || '—'}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Financials</div>
                <div className="text-gray-900 space-y-0.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">Rate</span>
                    <span className="font-medium">{rate != null ? `$${rate}/hr` : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">Hours</span>
                    <span className="font-medium">{totalHours}h</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-1 border-t">
                    <span className="text-gray-600">Total</span>
                    <span className="font-semibold text-green-600">{totalValue != null ? `$${totalValue.toLocaleString()}` : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {isAdvisor ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-gray-900 font-semibold mb-3">Advisor Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium text-gray-900 truncate">{roleLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-600">Academic Year:</span>
                    <span className="font-medium text-gray-900 truncate">{contract?.academic_year || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-600">Hours / student:</span>
                    <span className="font-medium text-gray-900">{hoursPerStudent}h</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-600">Judging hours / student:</span>
                    <span className="font-medium text-gray-900">{joinJudgingHours}h</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-600">Students:</span>
                    <span className="font-medium text-gray-900">{students.length}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-600">Total Hours:</span>
                    <span className="font-semibold text-gray-900">{totalHours}h</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-gray-900 font-semibold mb-3">Responsibilities</div>
                {responsibilities.length ? (
                  <div className="flex flex-wrap gap-2">
                    {responsibilities.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-800"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">—</div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-gray-900 font-semibold mb-3">Duties</div>
                {duties.length ? (
                  <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                    {duties.map((d, idx) => (
                      <li key={idx} className="break-words">{d}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">—</div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="text-gray-900 font-semibold">Students</div>
                  <div className="text-xs text-gray-500">{students.length} total</div>
                </div>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-600">
                          <th className="px-3 py-2 font-medium w-10">#</th>
                          <th className="px-3 py-2 font-medium min-w-[180px]">Student</th>
                          <th className="px-3 py-2 font-medium min-w-[240px]">Topic</th>
                          <th className="px-3 py-2 font-medium min-w-[200px]">Company</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {students.length ? (
                          students.map((s, idx) => {
                            const name = s?.student_name || '—';
                            const code = s?.student_code ? String(s.student_code) : '';
                            const topic = s?.project_title || s?.topic_title || s?.project_topic_title || '—';
                            const company = s?.company_name || '—';
                            return (
                              <tr key={idx} className="text-gray-800">
                                <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                                <td className="px-3 py-2">
                                  <div className="font-medium text-gray-900 truncate" title={code ? `${name} (${code})` : name}>
                                    {name}{code ? ` (${code})` : ''}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="truncate" title={topic}>{topic}</div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="truncate" title={company}>{company}</div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td className="px-3 py-3 text-gray-500" colSpan={4}>No students listed</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-gray-700 font-medium mb-2">Courses</div>
              <div className="rounded-lg border divide-y">
                {(contract.courses || []).map((cc, idx) => (
                  <div key={cc.id || idx} className="p-3 flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {cc.course_name || '—'}
                      </div>
                      <div className="text-gray-600 truncate">
                        {cc.course_code || cc.Course?.course_code || ''}
                      </div>
                    </div>
                    <div className="text-gray-700">{cc.hours || 0}h</div>
                  </div>
                ))}
                {!(contract.courses || []).length && (
                  <div className="p-3 text-gray-500 text-sm">No courses listed</div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
