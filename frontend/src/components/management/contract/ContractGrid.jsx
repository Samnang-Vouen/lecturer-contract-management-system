import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import ContractCard from './ContractCard';

/**
 * Grid of contract cards with header
 */
export default function ContractGrid({ 
  contracts, 
  onPreview, 
  onDownload, 
  onSign, 
  onShowDetail,
  downloadingId 
}) {
  return (
    <>
      {/* Count header above cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="rounded-2xl border bg-white shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-lg">All My Contracts ({(contracts || []).length})</span>
          </div>
          <div className="text-sm text-gray-600 mt-0.5">Complete history of your contracts</div>
        </div>
      </motion.div>

      {/* Unified card grid (mobile + desktop) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {(contracts || []).map(contract => (
          <ContractCard
            key={contract.id}
            contract={contract}
            onPreview={onPreview}
            onDownload={onDownload}
            onSign={onSign}
            onShowDetail={onShowDetail}
            downloadingId={downloadingId}
          />
        ))}
      </motion.div>
    </>
  );
}
