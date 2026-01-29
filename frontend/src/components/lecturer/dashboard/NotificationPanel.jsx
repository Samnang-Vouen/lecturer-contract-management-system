import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';

export const NotificationPanel = ({ 
  showNotifications, 
  setShowNotifications, 
  notifications, 
  unreadCount, 
  lastViewedAt,
  notifContainerRef 
}) => {
  return (
    <div className='relative' ref={notifContainerRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowNotifications(v => !v)}
        className='p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors relative shadow-sm'
        aria-haspopup='dialog'
        aria-expanded={showNotifications}
        aria-label='Notifications'
      >
        <Bell className='w-5 h-5 text-gray-600' />
        {unreadCount > 0 && (
          <motion.span 
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ duration: 1, repeat: Infinity }} 
            className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center'
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>
      <AnimatePresence>
        {showNotifications && (
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
              {(() => {
                const items = [...(notifications || [])].sort((a, b) => (b.ts || 0) - (a.ts || 0));
                if (!items.length) return <div className='p-4 text-center text-gray-500'>No notifications</div>;
                return items.map((n, i) => {
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
                          <p className={`text-sm ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-800'}`}>{n.message || 'Notification'}</p>
                          <p className='text-xs text-gray-500 mt-1'>{n.time || new Date().toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
