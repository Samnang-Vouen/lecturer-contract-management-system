import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Settings, GraduationCap, BookOpen, FileText, CheckCircle, Info, ArrowUp } from 'lucide-react';

export const QuickActions = ({ assignedCoursesCount, totalContractsCount, signedContractsCount, waitingManagementCount }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ duration: 0.6, delay: 0.8 }} 
      className='bg-white p-6 rounded-xl shadow-sm border border-gray-200'
    >
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-purple-100 rounded-lg'>
            <Zap className='w-5 h-5 text-purple-600' />
          </div>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>Quick Actions</h2>
            <p className='text-sm text-gray-600'>Common tasks</p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }} 
          className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
        >
          <Settings className='w-4 h-4' />
        </motion.button>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }} 
          whileTap={{ scale: 0.98 }} 
          className='group p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 hover:from-yellow-100 hover:to-orange-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md' 
          onClick={() => (window.location.href = '/lecturer/my-contracts')}
        >
          <div className='flex items-center gap-3 mb-3'>
            <motion.div 
              whileHover={{ rotate: 10 }} 
              className='p-2 bg-yellow-100 group-hover:bg-yellow-200 rounded-lg transition-colors'
            >
              <GraduationCap className='w-5 h-5 text-yellow-600' />
            </motion.div>
            <div>
              <h3 className='font-semibold text-yellow-700 group-hover:text-yellow-800'>View Contract</h3>
              <p className='text-xs text-yellow-600'>Status & download</p>
            </div>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-yellow-600'>Contract details</span>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ duration: 2, repeat: Infinity }} 
              className='w-4 h-4 bg-yellow-200 rounded-full' 
            />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }} 
          whileTap={{ scale: 0.98 }} 
          className='group p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md' 
          onClick={() => (window.location.href = '/lecturer/profile')}
        >
          <div className='flex items-center gap-3 mb-3'>
            <motion.div 
              whileHover={{ rotate: 10 }} 
              className='p-2 bg-purple-100 group-hover:bg-purple-200 rounded-lg transition-colors'
            >
              <Settings className='w-5 h-5 text-purple-600' />
            </motion.div>
            <div>
              <h3 className='font-semibold text-purple-700 group-hover:text-purple-800'>Update Profile</h3>
              <p className='text-xs text-purple-600'>Personal details</p>
            </div>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-purple-600'>Edit information</span>
            <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <ArrowUp className='w-4 h-4 text-purple-400 rotate-45' />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Mini stats */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 1 }} 
        className='mt-6 pt-6 border-t border-gray-200'
      >
        <div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
          {[
            { label: 'Courses', value: assignedCoursesCount, icon: BookOpen, color: 'blue' },
            { label: 'Total Contracts', value: totalContractsCount, icon: FileText, color: 'indigo' },
            { label: 'Signed Contracts', value: signedContractsCount, icon: CheckCircle, color: 'green' },
            { label: 'Waiting Management', value: waitingManagementCount, icon: Info, color: 'amber' }
          ].map((stat, index) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 1.2 + index * 0.1 }} 
              className='text-center group'
            >
              <motion.div 
                whileHover={{ scale: 1.1 }} 
                className={`inline-flex items-center justify-center w-8 h-8 bg-${stat.color}-100 rounded-full mb-2 group-hover:bg-${stat.color}-200 transition-colors`}
              >
                <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
              </motion.div>
              <div className='text-2xl font-bold text-gray-900'>{stat.value}</div>
              <div className='text-xs text-gray-500'>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
