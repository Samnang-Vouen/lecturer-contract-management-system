import React from 'react';
import { motion } from 'framer-motion';
import { PieChart } from 'lucide-react';
import {
  PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function DepartmentDistributionChart({ data }) {
  const colorPalette = [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4',
    '#A855F7', '#6366F1', '#14B8A6', '#F97316', '#DC2626', '#0EA5E9',
  ];

  const distributionList = Array.isArray(data) ? data : [];
  const departmentDistribution = distributionList.map((item, idx) => ({
    name: String(item.name || ''),
    value: Number(item.value || 0),
    color: colorPalette[idx % colorPalette.length]
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className='bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200'
    >
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-purple-100 rounded-lg'>
            <PieChart className='w-5 h-5 text-purple-600' />
          </div>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>Department Distribution</h2>
            <p className='text-sm text-gray-600'>Lecturers by department</p>
          </div>
        </div>
      </div>
      
      <div className='h-64 sm:h-80' style={{minHeight: '256px'}}>
        <ResponsiveContainer width="100%" height={320}>
          <RechartsPieChart>
            <Pie
              data={departmentDistribution}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {departmentDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
