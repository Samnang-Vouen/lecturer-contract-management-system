import { CheckCircle, XCircle, MessageCircle, Clock, AlertCircle } from 'lucide-react';

export const isE164 = (val) => /^\+\d{8,15}$/.test(String(val || ''));

export const getStatusColor = (status) => {
  switch (status) {
    case 'accepted': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'discussion': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'interview': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusIconComponent = (status) => {
  switch (status) {
    case 'accepted': return CheckCircle;
    case 'rejected': return XCircle;
    case 'discussion': return MessageCircle;
    case 'interview': return Clock;
    case 'pending': return Clock;
    default: return AlertCircle;
  }
};

export const ratingColorClass = (val) => {
  if (val >= 4) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (val >= 2.5) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (val > 0) return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-gray-50 text-gray-600 border-gray-200';
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
