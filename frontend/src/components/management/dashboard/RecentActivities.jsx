import React from 'react';
import { Clock, Filter } from 'lucide-react';

export default function RecentActivities({ activities }) {
  return (
    <div className='bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden xl:col-span-2'>
      <div className='px-6 py-5 border-b border-slate-100 flex items-start justify-between'>
        <div className='flex items-start gap-3'>
          <div className='w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center'>
            <Clock className='w-4 h-4' />
          </div>
          <div>
            <div className='text-base font-semibold text-slate-900'>Recent Activities</div>
            <div className='text-sm text-slate-500 -mt-0.5'>Latest system activities</div>
          </div>
        </div>
        <button className='inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm px-2 py-1 rounded-md hover:bg-slate-50'>
          <Filter className='w-4 h-4' />
        </button>
      </div>
      <div className='p-6'>
        {activities.length ? (
          <ul className='space-y-4'>
            {activities.map((a, i) => (
              <li 
                key={i} 
                className='relative pl-5 flex items-start gap-3 hover:bg-slate-50/60 rounded-md py-2 transition-colors'
              >
                <span className='absolute left-2 top-0 bottom-0 w-px bg-slate-200' />
                <span className={`absolute left-1.5 top-3 w-2 h-2 rounded-full ${a.dotClass || 'bg-blue-500'}`}></span>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-slate-900 truncate'>
                    {a.message || 'Contract updated'}
                  </p>
                  <p className='text-xs text-slate-500 mt-0.5'>{a.time || ''}</p>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${a.chipClass || 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                  {a.statusLabel || 'Activity'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className='flex flex-col items-center justify-center text-center py-10 text-slate-500'>
            <svg 
              xmlns='http://www.w3.org/2000/svg' 
              viewBox='0 0 24 24' 
              fill='none' 
              stroke='currentColor' 
              strokeWidth='1.5' 
              className='w-10 h-10 opacity-60'
            >
              <path 
                strokeLinecap='round' 
                strokeLinejoin='round' 
                d='M3 8.25C3 7.00736 4.00736 6 5.25 6h13.5C19.9926 6 21 7.00736 21 8.25v7.5C21 16.9926 19.9926 18 18.75 18H5.25C4.00736 18 3 16.9926 3 15.75v-7.5z' 
              />
              <path 
                strokeLinecap='round' 
                strokeLinejoin='round' 
                d='M7.5 9h9m-9 3h9m-9 3h6' 
              />
            </svg>
            <div className='mt-3 text-sm font-medium'>No recent activities</div>
            <div className='text-xs'>Activities will appear here as they occur</div>
          </div>
        )}
      </div>
    </div>
  );
}
