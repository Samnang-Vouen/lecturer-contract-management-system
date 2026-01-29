import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationPanel({ 
  show, 
  notifications, 
  lastViewedAt 
}) {
  if (!show) return null;

  const items = [...(notifications || [])].sort((a, b) => (b.ts || 0) - (a.ts || 0));

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -10, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        exit={{ opacity: 0, y: -10, scale: 0.95 }} 
        className='absolute right-0 top-12 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-xl z-50'
      >
        <div className='p-4 border-b border-gray-200'>
          <h3 className='font-semibold text-gray-900'>Notifications</h3>
          <p className='text-xs text-gray-500 mt-0.5'>Last 30 days</p>
        </div>
        <div className='max-h-64 overflow-y-auto'>
          {!items.length ? (
            <div className='p-4 text-center text-gray-500'>No notifications</div>
          ) : (
            items.map((n, i) => {
              const isUnread = (n.ts || 0) > (lastViewedAt || 0);
              return (
                <motion.div
                  key={`${n.ts || i}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${isUnread ? 'bg-blue-50/40' : ''}`}
                >
                  <div className='flex items-start gap-2'>
                    <span className={`mt-1 w-2 h-2 rounded-full ${isUnread ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className={`text-sm ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-800'}`}>
                        {n.message}
                      </p>
                      <p className='text-xs text-gray-500 mt-1'>{n.time}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
