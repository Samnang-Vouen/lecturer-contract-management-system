import axios from '../lib/axios';

export const getClasses = (page, limit) => axios.get('/classes', { params: { page, limit } });
export const createClass = (payload) => axios.post('/classes', payload);
export const updateClass = (id, payload) => axios.put(`/classes/${id}`, payload);
export const deleteClass = (id) => axios.delete(`/classes/${id}`);
export const updateClassCourses = (id, courses) => axios.put(`/classes/${id}/courses`, { courses });
