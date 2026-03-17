import React from 'react';
import { Plus, FileSpreadsheet, Users } from 'lucide-react';
import Button from '../../ui/Button';

export default function LecturerHeader({ onOpenCreateModal}) {
  return (
    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
      <div className='flex items-center gap-3 sm:gap-4 min-w-0'>
        <div className='p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shrink-0'>
          <Users className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
        </div>
        <div className='min-w-0'>
          <h1 className='text-xl sm:text-3xl font-bold text-gray-900 break-words'>Lecturer & Advisor Management</h1>
          <p className='text-gray-600 mt-1 sm:mt-2 text-sm sm:text-lg break-words'>Manage lecturer and advisor accounts and profiles</p>
        </div>
      </div>

      <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto'>
        {/* New Lecturer / Advisor */}
        <Button
          onClick={onOpenCreateModal}
          className='w-full sm:w-auto justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200'
        >
          <Plus className='w-5 h-5 mr-2' />
          <span>New Lecturer / Advisor</span>
        </Button>
      </div>
    </div>
  );
}