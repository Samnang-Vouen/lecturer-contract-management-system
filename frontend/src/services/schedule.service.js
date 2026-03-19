import axios from '../lib/axios';

export const getScheduleEntries = (params = {}) => axios.get('/schedule-entries', { params });

export const getSchedules = (params = {}) => axios.get('/schedules', { params });