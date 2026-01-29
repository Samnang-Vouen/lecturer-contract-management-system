import React from 'react';
import { User, Building2 } from 'lucide-react';
import { formatLecturerDisplay, getDepartmentName } from '../../../utils/contractUtils';

/**
 * Contract card header showing lecturer and department info
 */
export default function ContractCardInfo({ contract }) {
  return (
    <>
      {/* Lecturer section */}
      <div className="px-5 mt-4">
        <div className="flex items-start gap-3">
          <User className="w-4 h-4 text-gray-500 mt-0.5" />
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-base truncate">
              {formatLecturerDisplay(contract.lecturer)}
            </div>
            <div className="text-sm text-gray-600 truncate">
              {contract.lecturer?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Department */}
      <div className="px-5 mt-3">
        <div className="flex items-center gap-3 text-gray-800">
          <Building2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{getDepartmentName(contract)}</span>
        </div>
      </div>
    </>
  );
}
