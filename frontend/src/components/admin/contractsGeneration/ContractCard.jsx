import React from 'react';
import { Eye, Download, User, Building2, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, FileText, MoreVertical } from 'lucide-react';
import Badge from '../../ui/Badge.jsx';
import Button from '../../ui/Button.jsx';

/**
 * ContractCard - Card component for displaying a contract
 */
export default function ContractCard({ 
  contract, 
  mappingsByYear, 
  ratesByLecturer, 
  onMenuOpen, 
  onPreview, 
  onDownload 
}) {
  // Map backend status to display status
  const getStatusDisplay = () => {
    const status = (contract.status || '').toUpperCase();
    
    // WAITING_LECTURER: Admin created, awaiting lecturer signature
    if (status === 'WAITING_LECTURER') {
      return { 
        label: 'waiting lecturer', 
        variant: 'warning', 
        color: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        icon: Clock
      };
    }
    // WAITING_MANAGEMENT: Lecturer signed, awaiting management approval
    if (status === 'WAITING_MANAGEMENT') {
      return { 
        label: 'waiting management', 
        variant: 'info', 
        color: 'bg-blue-50 text-blue-700 border border-blue-200',
        icon: Clock
      };
    }
    // COMPLETED: All parties signed
    if (status === 'COMPLETED') {
      return { 
        label: 'completed', 
        variant: 'success', 
        color: 'bg-green-50 text-green-700 border border-green-200',
        icon: CheckCircle
      };
    }
    // REQUEST_REDO: Management requests revisions
    if (status === 'REQUEST_REDO') {
      return { 
        label: 'revision requested', 
        variant: 'danger', 
        color: 'bg-red-50 text-red-700 border border-red-200',
        icon: AlertCircle
      };
    }
    
    return { 
      label: 'draft', 
      variant: 'secondary', 
      color: 'bg-gray-50 text-gray-700 border border-gray-200',
      icon: Clock
    };
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  // Get lecturer display name
  const lecturerProfile = contract.lecturer?.LecturerProfile || {};
  const lecturerUser = contract.lecturer || {};
  const lecturerName = lecturerProfile.full_name_english || 
                       lecturerUser.display_name || 
                       lecturerUser.email?.split('@')[0] || 
                       'Unknown Lecturer';
  const lecturerEmail = lecturerUser.email || '';
  const lecturerTitle = lecturerProfile.title || '';
  const displayName = lecturerTitle ? `${lecturerTitle}. ${lecturerName}` : lecturerName;

  // Get department
  const department = lecturerUser.department_name || 'General';

  // Format contract ID
  const year = contract.academic_year?.split('-')[0] || new Date().getFullYear();
  const contractId = `CTR-${year}-${String(contract.id).padStart(3, '0')}`;

  // Calculate financial details
  const lecturerId = contract.lecturer_user_id;
  const hourlyRate = ratesByLecturer[lecturerId] || 0;
  const totalHours = (contract.courses || []).reduce((sum, c) => sum + (c.hours || 0), 0);
  const totalAmount = hourlyRate * totalHours;

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    onPreview?.(contract.id);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    onDownload?.(contract.id);
  };

  return (
    <div className="h-full">
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm flex flex-col h-full relative group transition-all duration-300 hover:shadow-lg hover:border-slate-300">
        <div className="flex-1 flex flex-col space-y-4">
          {/* Contract ID Header */}
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-semibold text-gray-900">{contractId}</span>
          </div>

          {/* Lecturer Info */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900">{displayName}</h3>
              <p className="text-sm text-gray-500">{lecturerEmail}</p>
            </div>
          </div>

          {/* Department */}
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900">Department</h3>
              <p className="text-sm text-gray-500">{department}</p>
            </div>
          </div>

          {/* Contract Period */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-base font-semibold text-gray-900">Contract Period</span>
            </div>
            <div className="text-sm font-medium text-gray-900">{formatDate(contract.start_date)}</div>
            <div className="text-sm text-gray-500">to {formatDate(contract.end_date)}</div>
          </div>

          {/* Financial Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <span className="text-base font-semibold text-gray-900">Financial Details</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Rate:</span>
                <span className="text-sm text-gray-900 font-medium">${hourlyRate}/hr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Hours:</span>
                <span className="text-sm text-gray-900 font-medium">{totalHours}h</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-500">Total:</span>
                <span className="text-green-600 font-semibold text-base">
                  ${totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer with Status and Actions */}
          <div className="flex items-center justify-between pt-4">
            <div 
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusDisplay.color}`}
            >
              <StatusIcon className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{statusDisplay.label}</span>
            </div>
            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={handlePreview}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all duration-200 shadow-sm"
                title="View contract PDF"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-600 hover:text-green-600 transition-all duration-200 shadow-sm"
                title="Download contract PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
