import axios from '../lib/axios';

export const getScheduleEntries = (params = {}) => axios.get('/schedule-entries', { params });