import React from 'react';
import { motion } from 'framer-motion';
import Button from '../../ui/Button.jsx';
import { Clock, Eye, PenTool } from 'lucide-react';
import { formatContractId, getHourlyRate, calculateTotalHours, formatMDY } from '../../../utils/contractUtils.js';

/**
 * Alert box showing contracts pending management signature
 */
export default function PendingSignaturesAlert({ contracts, onPreview, onSign, uploading }) {
  const pending = (contracts || []).filter(x => x.status === 'WAITING_MANAGEMENT');
  
  if (!pending.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-amber-700 font-semibold">
            <Clock className="w-4 h-4" /> 
            Contracts Awaiting Your Signature ({pending.length})
          </div>
          <p className="text-sm text-gray-600 mt-1">
            These contracts require your digital signature to proceed
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-3">
        {pending.map(contract => {
          const contractId = formatContractId(contract);
          const hours = calculateTotalHours(contract);
          const rate = getHourlyRate(contract);
          const startDate = contract.start_date || contract.startDate || null;
          const endDate = contract.end_date || contract.endDate || null;
          
          return (
            <div 
              key={contract.id} 
              className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-semibold text-gray-900">{contractId}</div>
                <div className="text-sm text-amber-900 mt-1">
                  {rate != null ? `$${rate}/hr` : '-'} • {hours} hours
                </div>
                {(startDate || endDate) && (
                  <div className="text-sm text-amber-900">
                    {formatMDY(startDate)}{startDate && endDate ? ' - ' : ''}{formatMDY(endDate)}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="cursor-pointer w-full sm:w-auto"
                  size="sm"
                  onClick={() => onPreview(contract.id)}
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  Review
                </Button>
                <Button
                  className="cursor-pointer w-full sm:w-auto"
                  size="sm"
                  onClick={() => onSign(contract)}
                  disabled={uploading}
                >
                  <PenTool className="w-4 h-4 mr-1.5" />
                  Sign Now
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
