import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const chartColors = {
  warning: '#F59E0B',
  info: '#06B6D4',
  success: '#10B981',
};

export default function ContractStatusChart({ statusCounts }) {
  const contractStatusData = [
    { 
      status: 'Waiting Lecturer', 
      key: 'WAITING_LECTURER', 
      count: Number(statusCounts?.WAITING_LECTURER || 0), 
      color: chartColors.warning 
    },
    { 
      status: 'Waiting Management', 
      key: 'WAITING_MANAGEMENT', 
      count: Number(statusCounts?.WAITING_MANAGEMENT || 0), 
      color: chartColors.info 
    },
    { 
      status: 'Completed', 
      key: 'COMPLETED', 
      count: Number(statusCounts?.COMPLETED || 0), 
      color: chartColors.success 
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className='bg-white p-6 rounded-xl shadow-sm border border-gray-200'
    >
      <div className='flex items-center gap-3 mb-6'>
        <div className='p-2 bg-orange-100 rounded-lg'>
          <FileText className='w-5 h-5 text-orange-600' />
        </div>
        <div>
          <h2 className='text-xl font-semibold text-gray-900'>Contract Status</h2>
          <p className='text-sm text-gray-600'>Current contract distribution</p>
        </div>
      </div>
      
      <div className='h-64' style={{minHeight: '256px'}}>
        <ResponsiveContainer width="100%" height={256}>
          <BarChart data={contractStatusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="status" 
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
            <Bar 
              dataKey="count" 
              radius={[4, 4, 0, 0]}
            >
              {contractStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
