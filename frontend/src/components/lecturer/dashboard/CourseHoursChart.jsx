import React from 'react';
import { motion } from 'framer-motion';
import { PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export const CourseHoursChart = ({ courseHoursDist }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ duration: 0.6, delay: 0.4 }} 
      className='bg-white p-6 rounded-xl shadow-sm border border-gray-200'
    >
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-purple-100 rounded-lg'>
            <PieChartIcon className='w-5 h-5 text-purple-600' />
          </div>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>Course Hours Distribution</h2>
            <p className='text-sm text-gray-600'>Total teaching hours per course</p>
          </div>
        </div>
      </div>
      <div className='h-64 md:h-72 lg:h-80' style={{minHeight: '256px'}}>
        <ResponsiveContainer width='100%' height={320}>
          <PieChart>
            <Pie 
              data={courseHoursDist} 
              cx='50%' 
              cy='50%' 
              innerRadius={60} 
              outerRadius={120} 
              paddingAngle={3} 
              dataKey='value' 
              nameKey='name'
            >
              {courseHoursDist.map((e, i) => (
                <Cell key={`cell-${i}`} fill={e.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(val, name)=>[`${Number(val).toLocaleString('en-US')} h`, name]} 
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
