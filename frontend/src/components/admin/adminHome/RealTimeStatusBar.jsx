import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

const getSystemHealthColor = (health) => {
  switch (health) {
    case 'excellent': return 'text-green-500';
    case 'good': return 'text-blue-500';
    case 'warning': return 'text-yellow-500';
    case 'critical': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

const getSystemHealthIcon = (health) => {
  switch (health) {
    case 'excellent': return <CheckCircle className='w-4 h-4' />;
    case 'good': return <CheckCircle className='w-4 h-4' />;
    case 'warning': return <AlertCircle className='w-4 h-4' />;
    case 'critical': return <XCircle className='w-4 h-4' />;
    default: return <Info className='w-4 h-4' />;
  }
};

export default function RealTimeStatusBar({ realTimeStats }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className='bg-white rounded-xl border border-gray-200 p-4 mb-6 sm:mb-8 shadow-sm'
    >
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-x-6 gap-y-2'>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className='flex items-center gap-2'
          >
            <Activity className='w-4 h-4 text-green-500' />
            <span className='text-xs sm:text-sm text-gray-600'>Online Users:</span>
            <span className='text-sm font-semibold text-gray-900'>{realTimeStats.onlineUsers}</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className='flex items-center gap-2'
          >
            <Activity className='w-4 h-4 text-blue-500' />
            <span className='text-xs sm:text-sm text-gray-600'>Expired Contracts:</span>
            <span className='text-sm font-semibold text-gray-900'>{realTimeStats.expiredContracts}</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className='flex items-center gap-2'
          >
            {getSystemHealthIcon(realTimeStats.systemHealth)}
            <span className='text-xs sm:text-sm text-gray-600'>System Health:</span>
            <span className={`text-sm font-semibold ${getSystemHealthColor(realTimeStats.systemHealth)}`}>
              {realTimeStats.systemHealth?.charAt(0).toUpperCase() + realTimeStats.systemHealth?.slice(1)}
            </span>
          </motion.div>
        </div>
        <div className='flex items-center gap-2 text-xs text-gray-500'>
          <Clock className='w-3 h-3' />
          Live updates every 30s
        </div>
      </div>
    </motion.div>
  );
}
