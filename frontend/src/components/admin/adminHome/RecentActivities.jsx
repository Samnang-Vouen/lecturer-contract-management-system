import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Filter, Activity, FileText, Users, UserPlus } from 'lucide-react';

const formatRelativeTime = (input) => {
  try {
    const t = new Date(input).getTime();
    if (!t || Number.isNaN(t)) return '';
    const diffMs = Date.now() - t;
    if (diffMs < 0) return 'Now';
    const sec = Math.floor(diffMs / 1000);
    if (sec < 5) return 'Now';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  } catch {
    return '';
  }
};

const getStatusBadgeClasses = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'scheduled':
    case 'in-progress':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'expired':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default function RecentActivities({ activities, isLoading }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className='bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200'
    >
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-blue-100 rounded-lg'>
            <Clock className='w-5 h-5 text-blue-600' />
          </div>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>Recent Activities</h2>
            <p className='text-sm text-gray-600'>Latest system activities</p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
        >
          <Filter className='w-4 h-4' />
        </motion.button>
      </div>
      
      <div className='space-y-4 max-h-72 sm:max-h-80 overflow-y-auto'>
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className='flex items-center gap-3 p-3 animate-pulse'
            >
              <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
              <div className='flex-1'>
                <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                <div className='h-3 bg-gray-200 rounded w-1/2'></div>
              </div>
            </motion.div>
          ))
        ) : activities.length > 0 ? (
          activities.map((activity, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className='flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 group'
            >
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'contract' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'user' ? 'bg-green-100 text-green-600' :
                  activity.type === 'lecturer' || activity.type === 'candidate' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                } group-hover:scale-110 transition-transform`}
              >
                {activity.type === 'contract' ? <FileText className='w-4 h-4' /> :
                 activity.type === 'user' ? <Users className='w-4 h-4' /> :
                 activity.type === 'lecturer' || activity.type === 'candidate' ? <UserPlus className='w-4 h-4' /> :
                 <Activity className='w-4 h-4' />}
              </motion.div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm text-gray-900 font-medium group-hover:text-blue-600 transition-colors flex items-center gap-2'>
                  <span className='truncate'>{activity.title}</span>
                  {activity.status && (
                    <span className={`ml-auto px-2 py-0.5 rounded-full border text-[10px] font-medium ${getStatusBadgeClasses(activity.status)}`}>
                      {String(activity.status).charAt(0).toUpperCase() + String(activity.status).slice(1)}
                    </span>
                  )}
                </p>
                {activity.name && (
                  <p className='text-xs text-gray-600 mt-1 truncate'>
                    {activity.name}
                  </p>
                )}
                <p className='text-xs text-gray-500 mt-1'>
                  {formatRelativeTime(activity.time || activity.createdAt)}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='text-center py-8'
          >
            <Activity className='w-12 h-12 text-gray-300 mx-auto mb-3' />
            <p className='text-gray-500'>No recent activities</p>
            <p className='text-xs text-gray-400 mt-1'>Activities will appear here as they occur</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
