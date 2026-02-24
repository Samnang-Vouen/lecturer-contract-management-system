import axios from '../lib/axios';

export const getSpecializations = (params = {}) => axios.get('/specializations', { params });
