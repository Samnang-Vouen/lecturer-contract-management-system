import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export const SyllabusReminder = ({ syllabusReminder }) => {
  if (!syllabusReminder?.needed && syllabusReminder?.uploaded !== false) {
    return null;
  }

  return (
    <div className='mb-4'>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className='p-4 rounded-xl border shadow-sm bg-yellow-50 border-yellow-200'
      >
        <div className='flex items-center gap-3'>
          <AlertCircle className='w-5 h-5 text-yellow-600' />
          <div className='flex-1'>
            <p className='text-sm text-yellow-800'>
              {syllabusReminder?.message || 'Please upload your course syllabus'}
            </p>
          </div>
          <button 
            onClick={() => (window.location.href = '/lecturer/profile')} 
            className='px-3 py-1 text-xs bg-yellow-600 text-white rounded-md hover:bg-yellow-700'
          >
            Upload
          </button>
        </div>
      </motion.div>
    </div>
  );
};
