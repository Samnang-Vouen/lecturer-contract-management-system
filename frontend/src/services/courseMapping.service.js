import { axiosInstance } from '../lib/axios';

export async function getAcceptedMappings({ academic_year, limit = 100, page } = {}) {
  const res = await axiosInstance.get('/course-mappings', {
    params: { academic_year, status: 'Accepted', limit, page },
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

export async function deleteCourseMapping(id, options = {}) {
  const params = {};
  if (Array.isArray(options?.ids) && options.ids.length) {
    params.ids = options.ids.join(',');
  }
  const res = await axiosInstance.delete(`/course-mappings/${id}`, { params });
  return res.data;
}
