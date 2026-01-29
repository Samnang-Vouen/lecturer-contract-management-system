import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, BarChart3 } from 'lucide-react';
import { getSystemHealthColor } from '../../../utils/lecturerDashboard.utils';
import { NotificationPanel } from './NotificationPanel';

export const DashboardHeader = ({
  authUser,
  realTimeStats,
  selectedTimeRange,
  setSelectedTimeRange,
  showNotifications,
  setShowNotifications,
  notifications,
  unreadCount,
  lastViewedAt,
  notifContainerRef,
  fetchDashboardData,
  isRefreshing,
  lastUpdated
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8'
    >
      <div className='mb-4 lg:mb-0'>
        <div className='flex items-center gap-4 mb-2'>
          <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className='p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white shadow-lg'>
            <BarChart3 className='w-8 h-8' />
          </motion.div>
          <div>
            <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Lecturer Dashboard
            </h1>
            <div className='flex items-center gap-2 mt-1'>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ duration: 2, repeat: Infinity }} 
                className={`w-2 h-2 rounded-full ${realTimeStats.systemHealth === 'good' ? 'bg-green-400' : 'bg-yellow-400'}`}
              />
              <span className='text-sm text-gray-600'>System Status: </span>
              <span className={`text-sm font-medium ${getSystemHealthColor(realTimeStats.systemHealth)}`}>
                {realTimeStats.systemHealth?.charAt(0).toUpperCase() + realTimeStats.systemHealth?.slice(1)}
              </span>
            </div>
          </div>
        </div>
        <p className='text-gray-600 max-w-2xl'>
          Welcome back, <span className='font-semibold text-gray-900'>{authUser?.fullName || authUser?.name || (authUser?.email ? authUser.email.split('@')[0] : 'Lecturer')}</span>
          <br />
          <span>Here's a snapshot of your courses and contracts.</span>
        </p>
      </div>

      {/* Header Controls */}
      <div className='flex items-center gap-3 flex-wrap sm:flex-nowrap'>
        <motion.select
          whileHover={{ scale: 1.02 }}
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
          className='px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full sm:w-auto'
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 3 months</option>
          <option value="1y">Last year</option>
        </motion.select>

        <NotificationPanel
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          notifications={notifications}
          unreadCount={unreadCount}
          lastViewedAt={lastViewedAt}
          notifContainerRef={notifContainerRef}
        />

        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          onClick={() => fetchDashboardData(true)} 
          disabled={isRefreshing} 
          className='flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm w-full sm:w-auto'
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </motion.button>

        {lastUpdated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='text-xs text-gray-500'>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
