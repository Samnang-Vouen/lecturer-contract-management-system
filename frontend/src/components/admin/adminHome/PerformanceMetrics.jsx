import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

const chartColors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',
};

export default function PerformanceMetrics() {
  const performanceMetrics = [
    { metric: 'Lecturer Satisfaction', value: 94, target: 90, color: chartColors.success },
    { metric: 'Contract Completion', value: 87, target: 85, color: chartColors.primary },
    { metric: 'Onboarding Speed', value: 92, target: 88, color: chartColors.secondary },
    { metric: 'System Uptime', value: 99.8, target: 99.5, color: chartColors.info }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className='bg-white p-6 rounded-xl shadow-sm border border-gray-200'
    >
      <div className='flex items-center gap-3 mb-6'>
        <div className='p-2 bg-green-100 rounded-lg'>
          <Target className='w-5 h-5 text-green-600' />
        </div>
        <div>
          <h2 className='text-xl font-semibold text-gray-900'>Performance Metrics</h2>
          <p className='text-sm text-gray-600'>Key performance indicators</p>
        </div>
      </div>
      
      <div className='space-y-6'>
        {performanceMetrics.map((metric, index) => (
          <motion.div 
            key={metric.metric}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className='relative'
          >
            <div className='flex justify-between items-center mb-2'>
              <span className='text-sm font-medium text-gray-700'>{metric.metric}</span>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-bold' style={{ color: metric.color }}>
                  {metric.value}%
                </span>
                <span className='text-xs text-gray-500'>
                  Target: {metric.target}%
                </span>
              </div>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${metric.value}%` }}
                transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                className='h-2 rounded-full'
                style={{ backgroundColor: metric.color }}
              />
            </div>
            <div 
              className='absolute top-6 w-0.5 h-2 bg-gray-400'
              style={{ left: `${metric.target}%` }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
