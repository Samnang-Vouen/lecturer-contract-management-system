import React from 'react';
import { motion } from 'framer-motion';
import { Activity, FileText, AlertCircle } from 'lucide-react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { getSystemHealthColor } from '../../../utils/chartHelpers';

const getSystemHealthIcon = (health) => {
  const icons = {
    excellent: <CheckCircle className='w-4 h-4' />,
    good: <CheckCircle className='w-4 h-4' />,
    warning: <AlertCircle className='w-4 h-4' />,
    critical: <XCircle className='w-4 h-4' />
  };
  return icons[health] || <Info className='w-4 h-4' />;
};

export default function RealTimeStatusBar({ 
  signedLecturersCount, 
  activeContracts, 
  expiredCount, 
  systemHealth 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6, delay: 0.2 }} 
      className='bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 mb-8 shadow-sm'
    >
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-3 sm:gap-6'>
          <motion.div whileHover={{ scale: 1.05 }} className='flex items-center gap-2'>
            <Activity className='w-4 h-4 text-green-500' />
            <span className='text-sm text-gray-600'>Signed Lecturers:</span>
            <span className='font-semibold text-gray-900'>{signedLecturersCount}</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className='flex items-center gap-2'>
            <FileText className='w-4 h-4 text-blue-500' />
            <span className='text-sm text-gray-600'>Active Contracts:</span>
            <span className='font-semibold text-gray-900'>{activeContracts}</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className='flex items-center gap-2'>
            <AlertCircle className='w-4 h-4 text-red-500' />
            <span className='text-sm text-gray-600'>Expired Contracts:</span>
            <span className='font-semibold text-gray-900'>{expiredCount}</span>
          </motion.div>
        </div>
        <div className='flex items-center gap-2'>
          <span className={`text-sm font-medium ${getSystemHealthColor(systemHealth)} flex items-center gap-1`}>
            {getSystemHealthIcon(systemHealth)}
            {systemHealth?.toUpperCase()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
