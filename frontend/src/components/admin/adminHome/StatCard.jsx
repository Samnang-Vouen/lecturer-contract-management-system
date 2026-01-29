import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';

const getChangeColor = (c) => c > 0 ? 'text-green-500' : c < 0 ? 'text-red-500' : 'text-gray-500';
const getChangeIcon = (c) => c > 0 ? <ArrowUp className='w-4 h-4' /> : c < 0 ? <ArrowDown className='w-4 h-4' /> : null;

export default function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  description, 
  isLoading, 
  color = 'blue', 
  trend = [], 
  index = 0 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group ${isLoading ? 'animate-pulse' : ''} relative overflow-hidden`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}-50 to-transparent opacity-50`}></div>
      
      <div className='relative z-10'>
        <div className='flex justify-between items-start mb-4'>
          <div className='flex-1'>
            <h2 className='text-sm font-semibold text-gray-700 mb-1'>{title}</h2>
            <div className='flex items-baseline gap-2'>
              <motion.span 
                key={value}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`text-3xl font-bold text-gray-900 ${isLoading ? 'bg-gray-200 rounded w-16 h-8' : ''}`}
              >
                {isLoading ? '' : value.toLocaleString()}
              </motion.span>
              {!isLoading && change !== 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center ${getChangeColor(change)} text-sm font-medium`}
                >
                  {getChangeIcon(change)}
                  <span className='ml-1'>
                    {change > 0 ? '+' : ''}{change}%
                  </span>
                </motion.div>
              )}
            </div>
            <p className='text-xs text-gray-500 mt-1'>{description}</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`p-3 bg-${color}-100 rounded-full group-hover:bg-${color}-200 transition-colors`}
          >
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </motion.div>
        </div>
        
        {/* Enhanced mini trend chart */}
        {trend.length > 0 && (
          <div className='flex items-end gap-1 h-12 mt-4'>
            {trend.slice(-10).map((value, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${(value / Math.max(...trend)) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`bg-gradient-to-t from-${color}-400 to-${color}-200 rounded-sm flex-1 transition-all duration-300 hover:from-${color}-500 hover:to-${color}-300 min-h-[4px]`}
                style={{ minHeight: '4px' }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
