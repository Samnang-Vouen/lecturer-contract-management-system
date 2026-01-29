import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber.jsx';
import { getChangeColor } from '../../../utils/chartHelpers.js';

const getChangeIcon = (c) => 
  c > 0 ? <ArrowUp className='w-4 h-4' /> : c < 0 ? <ArrowDown className='w-4 h-4' /> : null;

export default function StatCard({ 
  title, 
  value, 
  change = 0, 
  icon: Icon, 
  color = 'blue', 
  trend = [], 
  index = 0,
  selectedTimeRange = '30d'
}) {
  const normalizeTrend = (trend) => {
    const arr = Array.isArray(trend) ? trend.filter(n => Number.isFinite(Number(n))).map(Number) : [];
    const lastTen = arr.slice(-10);
    const pad = Math.max(0, 10 - lastTen.length);
    const bars = [...Array(pad).fill(0), ...lastTen];
    
    const seriesMin = Math.min(...bars, 0);
    const seriesMax = Math.max(...bars, 0);
    const minHeightPct = 30;
    
    return bars.map(v => {
      if (seriesMax === seriesMin) return minHeightPct;
      const normalized = (v - seriesMin) / Math.max(1e-6, (seriesMax - seriesMin));
      return minHeightPct + normalized * (100 - minHeightPct);
    });
  };

  const trendHeights = normalizeTrend(trend);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group relative overflow-hidden`}
    >
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
                className='text-3xl font-bold text-gray-900'
              >
                <AnimatedNumber value={Number(value || 0)} />
              </motion.span>
              {change !== 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  className={`flex items-center ${getChangeColor(change)} text-sm font-medium`}
                >
                  {getChangeIcon(change)}
                  <span className='ml-1'>{change > 0 ? '+' : ''}{change}%</span>
                </motion.div>
              )}
            </div>
            <p className='text-xs text-gray-500 mt-1'>Last {selectedTimeRange}</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }} 
            className={`p-3 bg-${color}-100 rounded-full group-hover:bg-${color}-200 transition-colors`}
          >
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </motion.div>
        </div>
        <div className='flex items-end gap-1 h-12 mt-4'>
          {trendHeights.map((height, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`bg-gradient-to-t from-${color}-400 to-${color}-200 rounded-sm flex-1`}
              style={{ minHeight: '4px' }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
