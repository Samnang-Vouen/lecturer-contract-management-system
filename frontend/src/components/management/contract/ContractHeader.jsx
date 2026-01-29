import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

/**
 * Page header component for contract management
 */
export default function ContractHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-4"
    >
      <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white shadow-lg">
        <FileText className="w-6 h-6" />
      </div>
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Contract Management
        </h1>
        <p className="text-gray-600">Review and approve contracts</p>
      </div>
    </motion.div>
  );
}
