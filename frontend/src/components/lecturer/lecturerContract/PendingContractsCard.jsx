import React from 'react';
import { Clock, FileText, Eye, PenTool } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import { 
  formatContractId, 
  calculateTotalHours, 
  formatMDY, 
  getLecturerDepartment 
} from '../../../utils/lecturerContractHelpers';

/**
 * PendingContractsCard Component
 * Displays contracts awaiting lecturer signature
 */
export default function PendingContractsCard({ 
  pendingContracts, 
  hourlyRate, 
  onPreview, 
  onSign 
}) {
  if (!pendingContracts || pendingContracts.length === 0) {
    return null;
  }

  const contract = pendingContracts[0];
  const formattedId = formatContractId(contract);
  const hours = calculateTotalHours(contract);
  const startDate = contract.start_date || contract.startDate || null;
  const endDate = contract.end_date || contract.endDate || null;
  const period = startDate && endDate 
    ? `${formatMDY(startDate)} - ${formatMDY(endDate)}` 
    : `Term ${contract.term} • ${contract.academic_year}`;
  const dept = getLecturerDepartment(contract);

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          <CardTitle>
            Contracts Awaiting Your Signature ({pendingContracts.length})
          </CardTitle>
        </div>
        <CardDescription>
          These contracts require your digital signature to proceed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-amber-200 bg-white px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
          {/* Left: details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-gray-900">{formattedId}</span>
            </div>
            <div className="text-sm text-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              <div>
                <span className="text-gray-600">Period:</span> {period}
              </div>
              <div className="truncate" title={dept || '—'}>
                <span className="text-gray-600">Department:</span> {dept || '—'}
              </div>
              <div>
                <span className="text-gray-600">Hours:</span> {hours}h
              </div>
              <div>
                <span className="text-gray-600">Rate:</span>{' '}
                {hourlyRate != null ? `$${hourlyRate}/hr` : '—'}
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-600">Total:</span>{' '}
                {hourlyRate != null 
                  ? `$${Math.round(hourlyRate * hours).toLocaleString()}` 
                  : '—'}
              </div>
            </div>
          </div>
          
          {/* Right: actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onPreview(contract.id)} 
              title="Preview contract" 
              className="border-amber-200"
            >
              <Eye className="w-4 h-4" /> Review
            </Button>
            <Button 
              size="sm" 
              onClick={() => onSign(contract)} 
              className="bg-amber-600 hover:bg-amber-700"
            >
              <PenTool className="w-4 h-4" /> Sign Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
