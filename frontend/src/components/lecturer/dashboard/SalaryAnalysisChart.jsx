import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';
import { chartColors } from '../../../utils/lecturerDashboard.constants';

export const SalaryAnalysisChart = ({ salaryAnalysis }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -50 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ duration: 0.6, delay: 0.3 }} 
      className='bg-white p-6 rounded-xl shadow-sm border border-gray-200'
    >
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-blue-100 rounded-lg'>
            <BarChart3 className='w-5 h-5 text-blue-600' />
          </div>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>Lecturer Salary Analysis</h2>
            <p className='text-sm text-gray-600'>Per-contract salary within contract date range (KHR)</p>
          </div>
        </div>
        <div className='text-sm text-gray-600'>
          Total: <span className='font-semibold text-gray-900'>{salaryAnalysis?.totals?.khr?.toLocaleString?.('en-US') || 0} KHR</span>
        </div>
      </div>
      <div className='h-64 md:h-72 lg:h-80' style={{minHeight: '256px'}}>
        <ResponsiveContainer width='100%' height={320}>
          <ComposedChart data={salaryAnalysis.byContract} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
            <XAxis dataKey='label' stroke='#666' fontSize={12} tickLine={false} />
            <YAxis yAxisId='left' stroke='#666' fontSize={12} tickLine={false} />
            <YAxis yAxisId='right' orientation='right' stroke='#666' fontSize={12} tickLine={false} />
            <Tooltip
              formatter={(val, key)=>{
                if (key === 'amountKhr') return [`${Number(val).toLocaleString('en-US')} KHR`, 'Salary'];
                if (key === 'hours') return [`${val}`, 'Hours'];
                return val;
              }}
              labelFormatter={(l, payload)=>{
                const item = (payload && payload[0] && payload[0].payload) || {};
                const sd = item.start_date ? new Date(item.start_date).toLocaleDateString() : 'n/a';
                const ed = item.end_date ? new Date(item.end_date).toLocaleDateString() : 'n/a';
                return `${l} • ${sd} → ${ed}`;
              }}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            />
            <Legend />
            <Bar yAxisId='left' dataKey='amountKhr' fill={chartColors.primary} name='Salary (KHR)' radius={[4, 4, 0, 0]} />
            <Line yAxisId='right' type='monotone' dataKey='hours' stroke={chartColors.secondary} strokeWidth={3} name='Hours' dot={{ fill: chartColors.secondary, strokeWidth: 2, r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
