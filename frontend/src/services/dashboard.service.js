import axios from '../lib/axios';

export const getDashboardStats = (timeRange) => axios.get(`/dashboard/stats`, { params: { timeRange } });
export const getRealtime = () => axios.get('/dashboard/realtime');
export const getNotifications = () => axios.get('/dashboard/notifications');

// Teaching contracts totals by status (department-scoped by backend)
export const getTeachingContractsTotal = (status) => axios.get('/teaching-contracts', { params: { page: 1, limit: 1, status } });

// Presence heartbeat (24–30s interval recommended)
export const postPresenceHeartbeat = () => axios.post('/dashboard/presence');
