import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Funnel, Activity, CheckCircle, Settings, Download, Key, Upload, FileText, Calendar } from 'lucide-react';
import { statusToUi } from '../../../utils/lecturerDashboard.utils';

export const RecentActivities = ({ activities, isLoading }) => {
  const formatTs = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return `${d.toLocaleDateString()} – ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '—';
    }
  };

  const getMeta = (a) => {
    const t = String(a?.type || a?.action || a?.event || '').toUpperCase();
    let icon = Activity;
    let bubble = 'bg-gray-100 text-gray-600';
    let label = a?.title || a?.description || 'Activity';
    let statusChip = null;

    const setStatusChip = (status) => {
      if (!status) return;
      const ui = statusToUi(status);
      statusChip = (
        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${ui.chipClass}`}>
          {ui.label}
        </span>
      );
    };

    if (/(SIGNED_CONTRACT|CONTRACT_SIGNED|SIGNED\s*CONTRACT|SIGN_CONTRACT)/.test(t)) {
      icon = CheckCircle;
      bubble = 'bg-green-100 text-green-600';
      label = 'Signed Contract';
      setStatusChip(a?.status);
    } else if (/(EDITED_PROFILE|PROFILE_UPDATED|UPDATE_PROFILE)/.test(t)) {
      icon = Settings;
      bubble = 'bg-blue-100 text-blue-600';
      label = 'Edited Profile';
    } else if (/(DOWNLOADED_CONTRACT|CONTRACT_DOWNLOADED|DOWNLOAD_CONTRACT)/.test(t)) {
      icon = Download;
      bubble = 'bg-indigo-100 text-indigo-600';
      label = 'Downloaded Contract';
    } else if (/(UPDATED_PASSWORD|PASSWORD_UPDATED|UPDATE_PASSWORD|CHANGE_PASSWORD)/.test(t)) {
      icon = Key;
      bubble = 'bg-amber-100 text-amber-600';
      label = 'Updated Password';
    } else if (/(UPLOADED_SYLLABUS|SYLLABUS_UPLOADED|UPLOAD_SYLLABUS)/.test(t)) {
      icon = Upload;
      bubble = 'bg-purple-100 text-purple-600';
      label = 'Uploaded Course Syllabus';
    } else if (/ASSIGNMENT/.test(t)) {
      icon = FileText;
      bubble = 'bg-purple-100 text-purple-600';
      label = a?.title || 'New Assignment';
    } else if (/CLASS/.test(t)) {
      icon = Calendar;
      bubble = 'bg-green-100 text-green-600';
      label = a?.title || 'Class Update';
    }

    return { icon, bubble, label, statusChip };
  };

  const parseTs = (a) => {
    const v = a?.ts ?? a?.timestamp ?? a?.time ?? a?.createdAt ?? a?.updatedAt ?? a?.created_at ?? a?.updated_at;
    const d = v instanceof Date ? v : new Date(v);
    const t = d.getTime();
    return Number.isFinite(t) ? t : 0;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -50 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ duration: 0.6, delay: 0.7 }} 
      className='bg-white p-6 rounded-xl shadow-sm border border-gray-200'
    >
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-blue-100 rounded-lg'>
            <Clock className='w-5 h-5 text-blue-600' />
          </div>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>Recent Activities</h2>
            <p className='text-sm text-gray-600'>Your latest actions</p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }} 
          className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
        >
          <Funnel className='w-4 h-4' />
        </motion.button>
      </div>
      <div className='space-y-4 max-h-80 overflow-y-auto'>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: index * 0.1 }} 
              className='flex items-center gap-3 p-3 animate-pulse'
            >
              <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
              <div className='flex-1'>
                <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                <div className='h-3 bg-gray-200 rounded w-1/2'></div>
              </div>
            </motion.div>
          ))
        ) : (() => {
          const items = [...(activities || [])]
            .map(a => ({ ...a, _ts: parseTs(a) }))
            .sort((a, b) => (b._ts || 0) - (a._ts || 0))
            .slice(0, 5);

          if (!items.length) {
            return (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className='text-center py-8'
              >
                <Activity className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                <p className='text-gray-500'>No recent activities</p>
                <p className='text-xs text-gray-400 mt-1'>New activities will appear here</p>
              </motion.div>
            );
          }

          return items.map((activity, index) => {
            const { icon: IconCmp, bubble, label, statusChip } = getMeta(activity);
            const ts = activity._ts || 0;
            return (
              <motion.div 
                key={`${ts}-${index}`} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: index * 0.06 }} 
                className='flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 group'
              >
                <motion.div 
                  whileHover={{ scale: 1.1 }} 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${bubble} group-hover:scale-110 transition-transform`}
                >
                  <IconCmp className='w-4 h-4' />
                </motion.div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm text-gray-900 font-medium group-hover:text-blue-600 transition-colors'>
                    {label}
                    {statusChip}
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>{formatTs(ts)}</p>
                </div>
              </motion.div>
            );
          });
        })()}
      </div>
    </motion.div>
  );
};
