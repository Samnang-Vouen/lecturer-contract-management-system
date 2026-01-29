import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Settings, FileText, ArrowUpRight, GraduationCap, Clock } from 'lucide-react';

export default function QuickActions({ totals, onlineUsers, pendingApprovals }) {
  return (
    <div className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm'>
      <div className='flex items-start justify-between mb-5'>
        <div className='flex items-start gap-3'>
          <div className='w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center'>
            <Zap className='w-4 h-4' />
          </div>
          <div>
            <div className='text-lg font-semibold text-slate-900'>Quick Actions</div>
            <div className='text-sm text-slate-500 -mt-0.5'>Common administrative tasks</div>
          </div>
        </div>
        <Settings className='w-4 h-4 text-slate-400' />
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        <motion.button
          onClick={() => (window.location.href = '/management/contracts')}
          whileHover={{ y: -4, rotate: 0.25 }}
          whileTap={{ y: 0, scale: 0.99 }}
          className='group relative text-left rounded-xl p-4 border bg-white/90 backdrop-blur-sm border-blue-200 transition-all shadow-sm hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400'
          role='button'
          aria-label='Open Contract Management'
        >
          <span className='pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(120deg,theme(colors.blue.200),transparent,theme(colors.blue.200))] opacity-0 group-hover:opacity-100 transition-opacity [mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] [mask-composite:exclude] p-px' />
          <div className='w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-3'>
            <FileText className='w-5 h-5' />
          </div>
          <div className='text-blue-700 font-semibold'>Contract Management</div>
          <div className='text-xs text-blue-700/80 mt-0.5'>Manage contracts</div>
          <div className='mt-6 text-xs text-blue-700 inline-flex items-center gap-1'>
            Open contracts
            <ArrowUpRight className='w-3.5 h-3.5 translate-x-0 opacity-60 transition-all group-hover:translate-x-0.5 group-hover:opacity-100' />
          </div>
        </motion.button>

        <motion.button
          onClick={() => (window.location.href = '/management/profile')}
          whileHover={{ y: -4, rotate: 0.25 }}
          whileTap={{ y: 0, scale: 0.99 }}
          className='group relative text-left rounded-xl p-4 border bg-white/90 backdrop-blur-sm border-amber-200 transition-all shadow-sm hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400'
          role='button'
          aria-label='Open Profile Settings'
        >
          <span className='pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(120deg,theme(colors.amber.200),transparent,theme(colors.amber.200))] opacity-0 group-hover:opacity-100 transition-opacity [mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] [mask-composite:exclude] p-px' />
          <div className='w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-3'>
            <Settings className='w-5 h-5' />
          </div>
          <div className='text-amber-700 font-semibold'>Profile Settings</div>
          <div className='text-xs text-amber-700/80 mt-0.5'>Update your profile</div>
          <div className='mt-6 text-xs text-amber-700 inline-flex items-center gap-1'>
            Open settings
            <ArrowUpRight className='w-3.5 h-3.5 translate-x-0 opacity-60 transition-all group-hover:translate-x-0.5 group-hover:opacity-100' />
          </div>
        </motion.button>
      </div>

      <div className='mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 text-center gap-4'>
        <div className='flex flex-col items-center gap-1'>
          <div className='w-8 h-8 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center'>
            <FileText className='w-4 h-4' />
          </div>
          <div className='text-xl font-semibold'>{totals?.all ?? 0}</div>
          <div className='text-xs text-slate-500'>Total Contracts</div>
        </div>
        <div className='flex flex-col items-center gap-1'>
          <div className='w-8 h-8 rounded-full bg-green-50 text-green-700 flex items-center justify-center'>
            <GraduationCap className='w-4 h-4' />
          </div>
          <div className='text-xl font-semibold'>{onlineUsers}</div>
          <div className='text-xs text-slate-500'>Active Lecturers</div>
        </div>
        <div className='flex flex-col items-center gap-1'>
          <div className='w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center'>
            <Clock className='w-4 h-4' />
          </div>
          <div className='text-xl font-semibold'>{pendingApprovals}</div>
          <div className='text-xs text-slate-500'>Waiting Lecturer</div>
        </div>
      </div>
    </div>
  );
}
