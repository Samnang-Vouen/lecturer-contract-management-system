import axios from '../lib/axios';

export const getCourses = (params = {}) => axios.get('/courses', { params });
export const createCourse = (payload) => axios.post('/courses', payload);
export const updateCourse = (id, payload) => axios.put(`/courses/${id}`, payload);
export const deleteCourse = (id) => axios.delete(`/courses/${id}`);
