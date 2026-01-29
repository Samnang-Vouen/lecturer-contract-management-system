import React from 'react';
import { DollarSign } from 'lucide-react';
import { getHourlyRate, calculateTotalHours, calculateSalary } from '../../../utils/contractUtils';

/**
 * Contract financial details section
 */
export default function ContractFinancials({ contract }) {
  const hours = calculateTotalHours(contract);
  const rate = getHourlyRate(contract);
  const salary = calculateSalary(contract);

  return (
    <div className="px-5 mt-4">
      <div className="flex items-center gap-3 text-gray-800">
        <DollarSign className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Financial Details</span>
      </div>
      <div className="mt-2 text-sm">
        <div className="flex items-center justify-between py-1">
          <span className="text-gray-700">Rate:</span>
          <span className="text-gray-900 font-semibold">
            {rate != null ? `$${rate}/hr` : '-'}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-gray-700">Hours:</span>
          <span className="font-semibold text-gray-900">{hours}h</span>
        </div>
        <div className="my-2 border-t" />
        <div className="flex items-center justify-between py-1">
          <span className="text-gray-800 font-medium">Total:</span>
          <span className="font-semibold text-green-600">
            {salary != null ? `$${salary.toLocaleString('en-US')}` : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}
