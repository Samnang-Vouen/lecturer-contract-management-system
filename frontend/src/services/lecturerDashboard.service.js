import axios from '../lib/axios';

export const getLecturerCourses = (params = {}) => axios.get('/lecturer/courses', { params }).then(r => r.data);
export const getLecturerDashboardSummary = (params = {}) => axios.get('/lecturer-dashboard/summary', { params }).then(r => r.data);
export const getLecturerRealtime = () => axios.get('/lecturer-dashboard/realtime').then(r => r.data);
export const getLecturerActivities = (params = {}) => axios.get('/lecturer-dashboard/activities', { params }).then(r => r.data);
export const getLecturerCourseMappings = (params = {}) => axios.get('/lecturer/course-mappings', { params }).then(r => r.data);
export const getLecturerSalaryAnalysis = (params = {}) => axios.get('/lecturer-dashboard/salary-analysis', { params }).then(r => r.data);
