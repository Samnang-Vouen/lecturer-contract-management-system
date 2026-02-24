import React from 'react';
import { Plus, Users } from 'lucide-react';
import Button from '../../ui/Button';

export default function LecturerHeader({ onOpenCreateModal }) {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-3 sm:gap-4'>
        <div className='p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl'>
          <Users className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
        </div>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Lecturer Management</h1>
          <p className='text-gray-600 mt-1 sm:mt-2 text-sm sm:text-lg'>Manage lecturer accounts and profiles</p>
        </div>
      </div>

      <Button
        onClick={onOpenCreateModal}
        className='w-auto justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200'
      >
        <Plus className='w-5 h-5 mr-2' />
        <span>New Lecturer</span>
      </Button>
    </div>
  );
}
