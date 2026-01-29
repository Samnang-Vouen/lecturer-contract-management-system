import { axiosInstance } from '../lib/axios';

export async function getAcceptedMappings({ academic_year, limit = 100 }) {
  const res = await axiosInstance.get('/course-mappings', {
    params: { academic_year, status: 'Accepted', limit },
  });
  return res.data;
}

export async function listCourseMappings(params) {
  const res = await axiosInstance.get('/course-mappings', { params });
  return res.data;
}

export async function createCourseMapping(payload) {
  const res = await axiosInstance.post('/course-mappings', payload);
  return res.data;
}

export async function updateCourseMapping(id, payload) {
  const res = await axiosInstance.put(`/course-mappings/${id}`, payload);
  return res.data;
}

export async function deleteCourseMapping(id) {
  const res = await axiosInstance.delete(`/course-mappings/${id}`);
  return res.data;
}
