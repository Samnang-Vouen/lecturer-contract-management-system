import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BarChart3, RefreshCw, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

const getSystemHealthColor = (health) => {
  switch (health) {
    case 'excellent': return 'text-green-500';
    case 'good': return 'text-blue-500';
    case 'warning': return 'text-yellow-500';
    case 'critical': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

export default function DashboardHeader({ 
  authUser, 
  realTimeStats, 
  selectedTimeRange, 
  setSelectedTimeRange, 
  notifications, 
  showNotifications, 
  setShowNotifications, 
  isRefreshing, 
  onRefresh, 
  lastUpdated 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8'
    >
      <div className='mb-4 lg:mb-0'>
        <div className='flex items-center gap-3 sm:gap-4 mb-2'>
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className='p-2.5 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white shadow-lg'
          >
            <BarChart3 className='w-6 h-6 sm:w-8 sm:h-8' />
          </motion.div>
          <div>
            <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Admin Dashboard
            </h1>
            <div className='flex items-center gap-2 mt-1'>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-2 h-2 rounded-full ${realTimeStats.systemHealth === 'good' ? 'bg-green-400' : 'bg-yellow-400'}`}
              ></motion.div>
              <span className='text-xs sm:text-sm text-gray-600'>System Status: </span>
              <span className={`text-xs sm:text-sm font-medium ${getSystemHealthColor(realTimeStats.systemHealth)}`}>
                {realTimeStats.systemHealth?.charAt(0).toUpperCase() + realTimeStats.systemHealth?.slice(1)}
              </span>
            </div>
          </div>
        </div>
        <p className='text-gray-600 max-w-2xl text-sm sm:text-base'>
          Welcome back,{' '}
          <span className='font-semibold text-gray-900'>
            {authUser?.fullName || authUser?.name || (authUser?.email ? authUser.email.split('@')[0] : 'Admin')}
          </span>
          <br />
          <span>
            Here's what's happening in your department
            {authUser?.department && (
              <strong className='font-semibold text-gray-900'> {authUser.department}</strong>
            )}
          </span>
        </p>
      </div>

      {/* Header Controls */}
      <div className='flex flex-wrap items-center gap-3 sm:gap-4'>
        {/* Time Range Selector */}
        <motion.select
          whileHover={{ scale: 1.02 }}
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
          className='px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm'
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 3 months</option>
          <option value="1y">Last year</option>
        </motion.select>

        {/* Notifications */}
        <div className='relative'>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className='p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors relative shadow-sm'
          >
            <Bell className='w-4 h-4 sm:w-5 sm:h-5 text-gray-600' />
            {notifications.length > 0 && (
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center'
              >
                {notifications.length}
              </motion.span>
            )}
          </motion.button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className='absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50'
              >
                <div className='p-4 border-b border-gray-200'>
                  <h3 className='font-semibold text-gray-900'>Notifications</h3>
                </div>
                <div className='max-h-64 overflow-y-auto'>
                  {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className='p-4 border-b border-gray-100 hover:bg-gray-50'
                      >
                        <p className='text-sm text-gray-800'>{notification.message}</p>
                        <p className='text-xs text-gray-500 mt-1'>{notification.time}</p>
                      </motion.div>
                    ))
                  ) : (
                    <div className='p-4 text-center text-gray-500'>No new notifications</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          disabled={isRefreshing}
          className='flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm'
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </motion.button>

        {/* Last Updated */}
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
