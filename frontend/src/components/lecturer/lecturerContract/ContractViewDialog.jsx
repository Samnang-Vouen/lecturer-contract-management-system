import React from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import { formatMDY, formatContractId, calculateTotalHours } from '../../../utils/lecturerContractHelpers';

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

  const formattedId = formatContractId(contract);
  const totalHours = calculateTotalHours(contract);
  const rate = contract?.hourly_rate ?? contract?.hourlyRate ?? hourlyRate;
  const totalValue = rate != null ? Math.round(rate * totalHours) : null;

  // Get status display
  const getStatusDisplay = () => {
    const status = (contract.status || '').toUpperCase();
    if (status === 'COMPLETED') {
      return {
        label: 'completed',
        class: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle
      };
    }
    return {
      label: status.toLowerCase(),
      class: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: null
    };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Contract Detail</DialogTitle>
              <DialogDescription>Summary and course breakdown</DialogDescription>
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
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Lecturer</div>
              <div className="font-medium">
                {contract.lecturer?.LecturerProfile?.full_name_english || 
                 contract.lecturer?.display_name || 
                 'Unknown'}
              </div>
              <div className="text-gray-600">{contract.lecturer?.email || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Status</div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${statusDisplay.class}`}>
                {statusDisplay.icon && <statusDisplay.icon className="w-3.5 h-3.5" />}
                {statusDisplay.label}
              </span>
            </div>
            <div>
              <div className="text-gray-500">Period</div>
              <div>{formatMDY(contract.start_date)} to {formatMDY(contract.end_date)}</div>
            </div>
            <div>
              <div className="text-gray-500">Financials</div>
              <div>
                <div>Rate: {rate != null ? `$${rate}/hr` : '-'}</div>
                <div>Hours: {totalHours}</div>
                <div>Total: {totalValue != null ? `$${totalValue.toLocaleString()}` : '-'}</div>
              </div>
            </div>
          </div>
          
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
