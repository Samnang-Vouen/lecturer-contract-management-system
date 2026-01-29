import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Calendar, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { getSystemHealthColor } from '../../../utils/lecturerDashboard.utils';

const getSystemHealthIcon = (h) => 
  h === 'critical' ? <XCircle className='w-4 h-4' /> : h === 'warning' ? <AlertCircle className='w-4 h-4' /> : <CheckCircle className='w-4 h-4' />;

export const RealTimeBar = ({ realTimeStats }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6, delay: 0.2 }} 
      className='bg-white rounded-xl border border-gray-200 p-4 mb-8 shadow-sm'
    >
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-4 md:gap-6'>
          <motion.div whileHover={{ scale: 1.05 }} className='flex items-center gap-2'>
            <Activity className='w-4 h-4 text-green-500' />
            <span className='text-sm text-gray-600'>Active Contracts:</span>
            <span className='font-semibold text-gray-900'>{realTimeStats.activeContracts}</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className='flex items-center gap-2'>
            <Calendar className='w-4 h-4 text-blue-500' />
            <span className='text-sm text-gray-600'>Expired Contracts:</span>
            <span className='font-semibold text-gray-900'>{realTimeStats.expiredContracts}</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className='flex items-center gap-2'>
            {getSystemHealthIcon(realTimeStats.systemHealth)}
            <span className='text-sm text-gray-600'>System Health:</span>
            <span className={`font-semibold ${getSystemHealthColor(realTimeStats.systemHealth)}`}>
              {realTimeStats.systemHealth?.charAt(0).toUpperCase() + realTimeStats.systemHealth?.slice(1)}
            </span>
          </motion.div>
        </div>
        <div className='flex items-center gap-2 text-xs text-gray-500'>
          <Clock className='w-3 h-3' /> Live updates every 30s
        </div>
      </div>
    </motion.div>
  );
};
