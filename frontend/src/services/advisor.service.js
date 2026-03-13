import { axiosInstance } from '../lib/axios';

export async function createAdvisor(payload) {
  const res = await axiosInstance.post('/advisors', payload);
  return res.data;
}

export async function createAdvisorFromCandidate(candidateId, payload) {
  const res = await axiosInstance.post(`/advisors/from-candidate/${candidateId}`, payload);
  return res.data;
}

export async function listAdvisors(params) {
  const res = await axiosInstance.get('/advisors', { params });
  return res.data;
}

export async function getAdvisorDetail(id) {
  const res = await axiosInstance.get(`/advisors/${id}/detail`);
  return res.data;
}

export async function updateAdvisorProfile(id, payload) {
  const res = await axiosInstance.patch(`/advisors/${id}/profile`, payload);
  return res.data;
}

export async function updateAdvisor(id, payload) {
  const res = await axiosInstance.put(`/advisors/${id}`, payload);
  return res.data;
}

export async function toggleAdvisorStatus(id) {
  const res = await axiosInstance.patch(`/advisors/${id}/status`);
  return res.data;
}

export async function deleteAdvisor(id) {
  const res = await axiosInstance.delete(`/advisors/${id}`);
  return res.data;
}

export async function uploadAdvisorPayroll(id, file) {
  const fd = new FormData();
  fd.append('payroll', file);
  const res = await axiosInstance.post(`/advisors/${id}/payroll`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function updateAdvisorCourses(id, course_ids) {
  const res = await axiosInstance.put(`/advisors/${id}/courses`, { course_ids });
  return res.data;
}
