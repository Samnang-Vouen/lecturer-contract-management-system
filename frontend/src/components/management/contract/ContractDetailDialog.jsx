import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import { X } from 'lucide-react';
import { 
  formatLecturerDisplay, 
  getStatusLabel, 
  formatMDY, 
  getHourlyRate, 
  calculateTotalHours, 
  calculateSalary 
} from '../../../utils/contractUtils';

/**
 * Dialog showing detailed contract information
 */
export default function ContractDetailDialog({ open, onOpenChange, contract }) {
  if (!contract) return null;

  const status = getStatusLabel(contract.status);
  const hours = calculateTotalHours(contract);
  const rate = getHourlyRate(contract);
  const salary = calculateSalary(contract);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Contract Detail</DialogTitle>
              <DialogDescription>Summary and course breakdown</DialogDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Lecturer</div>
              <div className="font-medium">{formatLecturerDisplay(contract.lecturer)}</div>
              <div className="text-gray-600">{contract.lecturer?.email}</div>
            </div>
            <div>
              <div className="text-gray-500">Status</div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium border ${status.class}`}>
                {status.icon ? React.createElement(status.icon, { className: 'w-3.5 h-3.5' }) : null}
                {status.label}
              </span>
            </div>
            <div>
              <div className="text-gray-500">Period</div>
              {contract.start_date && contract.end_date ? (
                <div>{formatMDY(contract.start_date)} to {formatMDY(contract.end_date)}</div>
              ) : (
                <div>{`Term ${contract.term}`} • {contract.academic_year}</div>
              )}
            </div>
            <div>
              <div className="text-gray-500">Financials</div>
              <div>
                <div>Rate: {rate != null ? `$${rate}/hr` : '-'}</div>
                <div>Hours: {hours}</div>
                <div>Total: {salary != null ? `$${salary.toLocaleString('en-US')}` : '-'}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-gray-700 font-medium mb-2">Courses</div>
            <div className="rounded-lg border divide-y">
              {(contract.courses || []).map((course, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {course?.Course?.course_name || course?.course_name || '—'}
                    </div>
                    <div className="text-gray-600 truncate">
                      {course?.Course?.course_code || course?.course_code || ''}
                    </div>
                  </div>
                  <div className="text-gray-700">{course?.hours || 0}h</div>
                </div>
              ))}
              {!(contract.courses || []).length && (
                <div className="p-3 text-gray-500 text-sm">No courses listed</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
