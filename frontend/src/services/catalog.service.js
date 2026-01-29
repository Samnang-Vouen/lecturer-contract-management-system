import { axiosInstance } from '../lib/axios';

export async function getDepartments() {
  const res = await axiosInstance.get('/catalog/departments');
  const data = res.data;
  return Array.isArray(data) ? data : (data?.departments || []);
}

export async function getCatalogCourses(params = {}) {
  const res = await axiosInstance.get('/catalog/courses', { params });
  const data = res.data;
  return Array.isArray(data) ? data : (data?.courses || []);
}
