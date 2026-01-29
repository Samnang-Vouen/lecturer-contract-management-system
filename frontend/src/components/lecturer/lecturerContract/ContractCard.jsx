import React from 'react';
import { 
  FileText, User2, Building2, Calendar, DollarSign, 
  Eye, PenTool, Download, Ellipsis 
} from 'lucide-react';
import { 
  formatContractId, 
  calculateTotalHours, 
  formatMDY, 
  getLecturerName, 
  getLecturerEmail, 
  getLecturerDepartment,
  getDisplayStatus,
  getStatusLabel
} from '../../../utils/lecturerContractHelpers';

/**
 * ContractCard Component
 * Individual contract card display
 */
export default function ContractCard({ 
  contract, 
  hourlyRate,
  lecturerProfile,
  authUser,
  menuOpenId,
  onMenuToggle,
  onPreview,
  onDownload,
  onViewDetail,
  onSign
}) {
  const formattedId = formatContractId(contract);
  const hours = calculateTotalHours(contract);
  const startDate = contract.start_date || contract.startDate || null;
  const endDate = contract.end_date || contract.endDate || null;
  const hasBothDates = !!(startDate && endDate);
  const totalValue = hourlyRate != null ? hourlyRate * hours : null;
  const displayStatus = getDisplayStatus(contract);
  const statusConfig = getStatusLabel(displayStatus);
  const canSign = 
    contract.status === 'MANAGEMENT_SIGNED' || 
    contract.status === 'WAITING_LECTURER';
  const deptDisplay = getLecturerDepartment(contract);
  const lecturerName = getLecturerName(contract, lecturerProfile, authUser);
  const lecturerEmail = getLecturerEmail(lecturerProfile, authUser);

  return (
    <div className="h-full">
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm flex flex-col h-full relative group transition-all duration-300 hover:shadow-lg hover:border-slate-300">
        <div className="flex-1 flex flex-col">
          {/* Header: CTR ID and overflow menu */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-gray-900 text-sm md:text-base">
                {formattedId}
              </span>
            </div>
            <button
              type="button"
              data-ellipsis
              onClick={(e) => {
                e.stopPropagation();
                onMenuToggle(contract.id);
              }}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              title="More"
              aria-label="More actions"
            >
              <Ellipsis className="w-4 h-4" />
            </button>
            
            {/* Dropdown menu */}
            {menuOpenId === contract.id && (
              <div
                data-menu
                className="absolute z-20 right-2 top-10 w-44 rounded-md border border-gray-200 bg-white shadow-lg py-1"
              >
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  onClick={() => onPreview(contract.id)}
                >
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span>View Contract</span>
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  onClick={() => onDownload(contract)}
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  <span>Download PDF</span>
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-orange-600"
                  onClick={() => onViewDetail(contract)}
                >
                  <FileText className="w-4 h-4 text-orange-500" />
                  <span>View Detail</span>
                </button>
              </div>
            )}
          </div>

          {/* Lecturer info */}
          <div className="mb-2">
            <div className="grid grid-cols-[16px_1fr] items-center gap-3">
              <User2 className="w-4 h-4 text-gray-500" />
              <div className="min-w-0">
                <div className="text-gray-900 font-medium truncate">
                  {lecturerName || '—'}
                </div>
                <div className="text-xs text-gray-600 truncate" title={lecturerEmail || '—'}>
                  {lecturerEmail || '—'}
                </div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-[16px_1fr] items-center gap-3">
              <Building2 className="w-4 h-4 text-gray-500" />
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900">Department</h3>
                <div className="text-xs text-gray-700 truncate min-w-0" title={deptDisplay || '—'}>
                  {deptDisplay || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Contract Period */}
          <div className="mb-2">
            <div className="flex items-center gap-3 text-gray-800">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Contract Period</span>
            </div>
            <div className="text-sm text-gray-900">
              {hasBothDates ? (
                <div className="space-y-0.5">
                  <div className="font-semibold">{formatMDY(startDate)}</div>
                  <div className="text-gray-500">to</div>
                  <div>{formatMDY(endDate)}</div>
                </div>
              ) : (
                <span>{`Term ${contract.term} • ${contract.academic_year}`}</span>
              )}
            </div>
          </div>

          {/* Financial Details */}
          <div className="mb-1">
            <div className="flex items-center gap-3 text-gray-800">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Financial Details</span>
            </div>
            <div className="text-sm text-gray-900 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Rate:</span>
                <span className="font-medium">
                  {hourlyRate != null ? `$${hourlyRate}/hr` : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Hours:</span>
                <span className="font-semibold">{hours}h</span>
              </div>
              <div className="border-t my-1" />
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Total:</span>
                <span className="font-semibold text-green-600">
                  {totalValue != null ? `$${Math.round(totalValue).toLocaleString()}` : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar: status (left) + actions (right) */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold border ${statusConfig.class}`}>
            {statusConfig.icon && <statusConfig.icon className="w-3.5 h-3.5" />}
            {statusConfig.label}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPreview(contract.id)}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all duration-200 shadow-sm"
              title="Preview"
              aria-label="Preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            {canSign && (
              <button
                onClick={() => onSign(contract)}
                className="p-2 rounded-lg bg-blue-600 border border-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-sm"
                title="Sign"
                aria-label="Sign"
              >
                <PenTool className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onDownload(contract)}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-green-300 hover:bg-green-50 text-slate-600 hover:text-green-600 transition-all duration-200 shadow-sm"
              title="Download"
              aria-label="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
