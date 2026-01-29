import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Bell, RefreshCw } from 'lucide-react';
import { getSystemHealthColor } from '../../../utils/chartHelpers';

export default function DashboardHeader({ 
  realTimeStats, 
  selectedTimeRange, 
  setSelectedTimeRange, 
  showNotifications,
  setShowNotifications,
  unreadCount,
  notifContainerRef,
  onRefresh,
  isRefreshing,
  lastUpdated,
  NotificationPanel
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6 }} 
      className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8'
    >
      <div className='mb-4 lg:mb-0'>
        <div className='flex items-center gap-4 mb-2'>
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }} 
            className='p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white shadow-lg'
          >
            <BarChart3 className='w-8 h-8' />
          </motion.div>
          <div>
            <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Management Dashboard
            </h1>
            <div className='flex items-center gap-2 mt-1'>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ duration: 2, repeat: Infinity }} 
                className={`w-2 h-2 rounded-full ${['good','excellent'].includes(realTimeStats.systemHealth) ? 'bg-green-400' : 'bg-yellow-400'}`}
              ></motion.div>
              <span className='text-sm text-gray-600'>System Status: </span>
              <span className={`text-sm font-medium ${getSystemHealthColor(realTimeStats.systemHealth)}`}>
                {realTimeStats.systemHealth?.charAt(0).toUpperCase() + realTimeStats.systemHealth?.slice(1)}
              </span>
            </div>
          </div>
        </div>
        <p className='text-gray-600 max-w-2xl'>
          Welcome back. Here's what's happening in your approval queue and departments.
        </p>
      </div>
      <div className='flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 w-full lg:w-auto mt-2 lg:mt-0'>
        <motion.select 
          whileHover={{ scale: 1.02 }} 
          value={selectedTimeRange} 
          onChange={(e) => setSelectedTimeRange(e.target.value)} 
          className='px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full sm:w-auto min-w-[160px]'
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 3 months</option>
          <option value="1y">Last year</option>
        </motion.select>
        <div ref={notifContainerRef} className='relative'>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(prev => !prev)}
            className='p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors relative shadow-sm'
          >
            <Bell className='w-5 h-5 text-gray-600' />
            {unreadCount > 0 && (
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ duration: 1, repeat: Infinity }} 
                className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center'
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>
          {NotificationPanel}
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          onClick={onRefresh} 
          disabled={isRefreshing} 
          className='flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm w-full sm:w-auto'
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </motion.button>
        {lastUpdated && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className='text-xs text-gray-500'
          >
            Last updated: {lastUpdated.toLocaleTimeString()}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
