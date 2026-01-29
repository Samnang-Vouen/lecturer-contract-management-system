import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function MonthlyTrendsChart({ data }) {
  const monthlyTrendsData = (data && data.length)
    ? data
    : [
        { month: 'Jan', lecturers: 45, contracts: 32, applications: 78 },
        { month: 'Feb', lecturers: 52, contracts: 38, applications: 85 },
        { month: 'Mar', lecturers: 48, contracts: 35, applications: 92 },
        { month: 'Apr', lecturers: 61, contracts: 42, applications: 105 },
        { month: 'May', lecturers: 58, contracts: 39, applications: 98 },
        { month: 'Jun', lecturers: 65, contracts: 45, applications: 112 }
      ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className='bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200'
    >
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-blue-100 rounded-lg'>
            <TrendingUp className='w-5 h-5 text-blue-600' />
          </div>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>Monthly Trends</h2>
            <p className='text-sm text-gray-600'>Lecturers, contracts & applications</p>
          </div>
        </div>
      </div>
      
      <div className='h-64 sm:h-80' style={{minHeight: '256px'}}>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={monthlyTrendsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#666" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#666" 
              fontSize={12}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar 
              dataKey="lecturers" 
              fill="#3B82F6" 
              name="Lecturers"
              radius={[4, 4, 0, 0]}
            />
            <Line 
              type="monotone" 
              dataKey="contracts" 
              stroke="#8B5CF6" 
              strokeWidth={3}
              name="Contracts"
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="applications" 
              stroke="#10B981" 
              strokeWidth={3}
              name="Applications"
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
