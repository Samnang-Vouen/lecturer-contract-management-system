import React from 'react';
import { MoreVertical, Eye, BookOpen } from 'lucide-react';

export default function LecturerTableRow({ lecturer, onOpenMenu, onOpenCoursesPopover }) {
  const handleMenuClick = (e) => {
    e.stopPropagation();
    onOpenMenu(lecturer.id, e);
  };

  const handleCoursesClick = (e) => {
    e.stopPropagation();
    onOpenCoursesPopover(lecturer, e);
  };

  const statusColor = lecturer.status === 'active' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-gray-100 text-gray-800';

  return (
    <tr className='border-b border-gray-100 hover:bg-gray-50'>
      <td className='px-6 py-4'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm'>
            {lecturer.name?.charAt(0)?.toUpperCase() || 'L'}
          </div>
          <div>
            <div className='font-medium text-gray-900'>{lecturer.name || 'Unknown'}</div>
            <div className='text-sm text-gray-500'>{lecturer.email || ''}</div>
          </div>
        </div>
      </td>
      <td className='px-6 py-4 text-sm text-gray-700'>
        {lecturer.department || '—'}
      </td>
      <td className='px-6 py-4 text-sm text-gray-700'>
        {lecturer.position || 'Lecturer'}
      </td>
      <td className='px-6 py-4'>
        <div className='flex flex-wrap gap-1'>
          {lecturer.researchFields?.length > 0 ? (
            lecturer.researchFields.slice(0, 2).map((field, idx) => (
              <span 
                key={idx}
                className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800'
              >
                {field}
              </span>
            ))
          ) : (
            <span className='text-sm text-gray-400'>—</span>
          )}
          {lecturer.researchFields?.length > 2 && (
            <span className='text-xs text-gray-500'>+{lecturer.researchFields.length - 2}</span>
          )}
        </div>
      </td>
      <td className='px-6 py-4'>
        {lecturer.courses?.length > 0 ? (
          <button
            onClick={handleCoursesClick}
            className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors'
          >
            <BookOpen className='w-3.5 h-3.5' />
            {lecturer.courses.length}
          </button>
        ) : (
          <span className='text-sm text-gray-400'>—</span>
        )}
      </td>
      <td className='px-6 py-4'>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
          {lecturer.status || 'inactive'}
        </span>
      </td>
      <td className='px-6 py-4 text-right'>
        <button
          onClick={handleMenuClick}
          className='lecturer-action-trigger inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors'
          aria-label='Open menu'
        >
          <MoreVertical className='w-4 h-4' />
        </button>
      </td>
    </tr>
  );
}
