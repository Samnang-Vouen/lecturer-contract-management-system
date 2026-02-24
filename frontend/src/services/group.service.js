import axios from '../lib/axios';

export const getGroups = (params = {}) => axios.get('/groups', { params });
export const createGroup = (payload) => axios.post('/groups', payload);
export const updateGroup = (id, payload) => axios.put(`/groups/${id}`, payload);
export const deleteGroup = (id) => axios.delete(`/groups/${id}`);
