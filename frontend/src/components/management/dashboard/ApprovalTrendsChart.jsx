import React from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function ApprovalTrendsChart({ monthlyData }) {
  return (
    <div className='bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden xl:col-span-2'>
      <div className='px-6 py-4 border-b border-slate-100'>
        <h2 className='text-xl font-semibold text-slate-900'>Approval Trends</h2>
        <p className='text-sm text-slate-600'>Monthly waiting lecturer, waiting management, and completed</p>
      </div>
      <div className='p-6 h-64 sm:h-72 lg:h-80' style={{minHeight: '256px'}}>
        <ResponsiveContainer width='100%' height={320}>
          <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id='lineBlue' x1='0' y1='0' x2='1' y2='0'>
                <stop offset='0%' stopColor='#3B82F6' />
                <stop offset='100%' stopColor='#8B5CF6' />
              </linearGradient>
              <linearGradient id='linePurple' x1='0' y1='0' x2='1' y2='0'>
                <stop offset='0%' stopColor='#8B5CF6' />
                <stop offset='100%' stopColor='#06B6D4' />
              </linearGradient>
              <linearGradient id='lineGreen' x1='0' y1='0' x2='1' y2='0'>
                <stop offset='0%' stopColor='#10B981' />
                <stop offset='100%' stopColor='#34D399' />
              </linearGradient>
              <filter id='softGlow' x='-50%' y='-50%' width='200%' height='200%'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur' />
                <feMerge>
                  <feMergeNode in='coloredBlur' />
                  <feMergeNode in='SourceGraphic' />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='month' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              name='waiting lecturer' 
              type='monotone' 
              dataKey='waitingLecturer' 
              stroke='url(#lineBlue)' 
              strokeWidth={2} 
              dot={{ r: 3 }} 
              filter='url(#softGlow)' 
            />
            <Line 
              name='waiting management' 
              type='monotone' 
              dataKey='waitingManagement' 
              stroke='url(#linePurple)' 
              strokeWidth={2} 
              dot={{ r: 3 }} 
              filter='url(#softGlow)' 
            />
            <Line 
              name='completed' 
              type='monotone' 
              dataKey='completed' 
              stroke='url(#lineGreen)' 
              strokeWidth={2} 
              dot={{ r: 3 }} 
              filter='url(#softGlow)' 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
