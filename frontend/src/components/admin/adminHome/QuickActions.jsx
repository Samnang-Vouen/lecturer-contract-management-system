import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Settings, UserPlus, Users, BookOpen, FileText, ArrowUp, GraduationCap, Clock } from 'lucide-react';

export default function QuickActions({ dashboardData }) {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className='bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200'
    >
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-purple-100 rounded-lg'>
            <Zap className='w-5 h-5 text-purple-600' />
          </div>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>Quick Actions</h2>
            <p className='text-sm text-gray-600'>Common administrative tasks</p>
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
        {/* Recruitment Candidate Action */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className='group p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 hover:from-purple-100 hover:to-blue-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md'
          onClick={() => navigate('/admin/recruitment')}
        >
          <div className='flex items-center gap-3 mb-3'>
            <motion.div 
              whileHover={{ rotate: 10 }}
              className='p-2 bg-purple-100 group-hover:bg-purple-200 rounded-lg transition-colors'
            >
              <UserPlus className='w-5 h-5 text-purple-600' />
            </motion.div>
            <div>
              <h3 className='font-semibold text-purple-700 group-hover:text-purple-800'>Recruitment Candidate</h3>
              <p className='text-xs text-purple-600'>Manage lecturer recruitment candidates</p>
            </div>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-purple-600'>Manage recruitment</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowUp className='w-4 h-4 text-purple-400 transform rotate-45' />
            </motion.div>
          </div>
        </motion.div>

        {/* Add Lecturer Action */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className='group p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md'
          onClick={() => navigate('/admin/lecturers')}
        >
          <div className='flex items-center gap-3 mb-3'>
            <motion.div 
              whileHover={{ rotate: 10 }}
              className='p-2 bg-blue-100 group-hover:bg-blue-200 rounded-lg transition-colors'
            >
              <Users className='w-5 h-5 text-blue-600' />
            </motion.div>
            <div>
              <h3 className='font-semibold text-blue-700 group-hover:text-blue-800'>Add Lecturer</h3>
              <p className='text-xs text-blue-600'>Add and manage lecturers</p>
            </div>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-blue-600'>Open lecturer management</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowUp className='w-4 h-4 text-blue-400 transform rotate-45' />
            </motion.div>
          </div>
        </motion.div>

        {/* Course Mapping Action */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className='group p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-200 hover:from-green-100 hover:to-teal-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md'
          onClick={() => navigate('/admin/course-mapping')}
        >
          <div className='flex items-center gap-3 mb-3'>
            <motion.div 
              whileHover={{ rotate: 10 }}
              className='p-2 bg-green-100 group-hover:bg-green-200 rounded-lg transition-colors'
            >
              <BookOpen className='w-5 h-5 text-green-600' />
            </motion.div>
            <div>
              <h3 className='font-semibold text-green-700 group-hover:text-green-800'>Course Mapping</h3>
              <p className='text-xs text-green-600'>Assign and manage course mappings</p>
            </div>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-green-600'>Open course mapping</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowUp className='w-4 h-4 text-green-400 transform rotate-45' />
            </motion.div>
          </div>
        </motion.div>

        {/* Generate Contract Action */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className='group p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:from-orange-100 hover:to-red-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md'
          onClick={() => navigate('/admin/contracts')}
        >
          <div className='flex items-center gap-3 mb-3'>
            <motion.div 
              whileHover={{ rotate: 10 }}
              className='p-2 bg-orange-100 group-hover:bg-orange-200 rounded-lg transition-colors'
            >
              <FileText className='w-5 h-5 text-orange-600' />
            </motion.div>
            <div>
              <h3 className='font-semibold text-orange-700 group-hover:text-orange-800'>Generate Contract</h3>
              <p className='text-xs text-orange-600'>Create and manage lecturer contracts</p>
            </div>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-orange-600'>Open contract generation</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowUp className='w-4 h-4 text-orange-400 transform rotate-45' />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Additional Stats */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className='mt-6 pt-6 border-t border-gray-200'
      >
        <div className='grid grid-cols-3 gap-3 sm:gap-4'>
          {[
            { label: 'Total Users', value: dashboardData.totalUsers.count, icon: Users, color: 'blue' },
            { label: 'Active Lecturers', value: dashboardData.activeLecturers.count, icon: GraduationCap, color: 'green' },
            { label: 'Pending Contracts', value: dashboardData.pendingContracts.count, icon: Clock, color: 'orange' }
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
}
