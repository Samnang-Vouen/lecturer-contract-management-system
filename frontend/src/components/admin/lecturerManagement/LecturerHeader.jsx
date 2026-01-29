import React from 'react';
import { Users, UserPlus } from 'lucide-react';

export default function LecturerHeader() {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-3'>
        <div className='p-2 bg-blue-100 rounded-lg'>
          <Users className='w-6 h-6 text-blue-600' />
        </div>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Lecturer Management</h1>
          <p className='text-sm text-gray-600'>Manage lecturer accounts and profiles</p>
        </div>
      </div>
    </div>
  );
}
