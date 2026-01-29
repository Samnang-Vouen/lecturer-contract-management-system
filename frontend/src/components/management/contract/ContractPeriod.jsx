import React from 'react';
import { Calendar } from 'lucide-react';
import { formatMDY } from '../../../utils/contractUtils';

/**
 * Contract period section showing dates or term info
 */
export default function ContractPeriod({ contract }) {
  const startDate = contract.start_date || contract.startDate || null;
  const endDate = contract.end_date || contract.endDate || null;

  return (
    <div className="px-5 mt-4">
      <div className="flex items-center gap-3 text-gray-800">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Contract Period</span>
      </div>
      <div className="mt-2 text-sm">
        {startDate && endDate ? (
          <div className="text-gray-900">
            <div className="font-semibold">{formatMDY(startDate)}</div>
            <div className="text-gray-600">to</div>
            <div>{formatMDY(endDate)}</div>
          </div>
        ) : (
          <div className="text-gray-900">
            {`Term ${contract.term}`} <span className="text-gray-600">•</span> {contract.academic_year}
          </div>
        )}
      </div>
    </div>
  );
}
