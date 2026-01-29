export const chartColors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',
  purple: '#A855F7'
};

export const weeklyOverviewData = [
  { day: 'Mon', hours: 3, sessions: 2 },
  { day: 'Tue', hours: 4, sessions: 3 },
  { day: 'Wed', hours: 2, sessions: 1 },
  { day: 'Thu', hours: 5, sessions: 3 },
  { day: 'Fri', hours: 3, sessions: 2 },
  { day: 'Sat', hours: 1, sessions: 1 }
];

export const gradeDistributionData = (chartColors) => [
  { name: 'A', value: 35, color: chartColors.success },
  { name: 'B', value: 30, color: chartColors.primary },
  { name: 'C', value: 20, color: chartColors.secondary },
  { name: 'D', value: 10, color: chartColors.warning },
  { name: 'F', value: 5, color: chartColors.error }
];

export const NOTIF_KEY = 'lis:notifications';
export const NOTIF_LAST_SEEN_KEY = 'lecNotifLastSeenTs';
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
export const AUTO_REFRESH_INTERVAL = 300000; // 5 minutes
export const REALTIME_POLL_INTERVAL = 30000; // 30 seconds
