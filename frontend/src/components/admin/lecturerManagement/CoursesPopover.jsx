import React, { useEffect, useRef } from 'react';
import { X, BookOpen } from 'lucide-react';

export default function CoursesPopover({ courses, coords, onClose }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className='fixed z-50 w-72 bg-white rounded-lg shadow-xl border border-gray-200'
      style={{
        top: `${coords.y}px`,
        left: `${coords.x}px`,
      }}
    >
      <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200'>
        <div className='flex items-center gap-2 text-sm font-medium text-gray-900'>
          <BookOpen className='w-4 h-4 text-blue-600' />
          Assigned Courses
        </div>
        <button
          onClick={onClose}
          className='p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          aria-label='Close'
        >
          <X className='w-4 h-4' />
        </button>
      </div>
      <div className='max-h-64 overflow-y-auto'>
        {courses.length === 0 ? (
          <div className='px-4 py-6 text-center text-sm text-gray-500'>
            No courses assigned
          </div>
        ) : (
          <div className='p-2 space-y-1'>
            {courses.map((course, idx) => (
              <div
                key={idx}
                className='px-3 py-2 rounded hover:bg-gray-50 text-sm'
              >
                <div className='font-medium text-gray-900'>
                  {course.code || course.name}
                </div>
                {course.code && course.name && (
                  <div className='text-xs text-gray-500 mt-0.5'>
                    {course.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
