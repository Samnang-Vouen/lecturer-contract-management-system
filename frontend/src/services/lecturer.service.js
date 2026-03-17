import { axiosInstance } from '../lib/axios';

export async function listLecturers(params) {
  // Ensure array params (like role) become repeated keys: role=a&role=b
  if (params && Array.isArray(params.role)) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (key === 'role' && Array.isArray(value)) {
        value.forEach((v) => sp.append('role', String(v)));
        return;
      }
      sp.set(key, String(value));
    });
    const qs = sp.toString();
    const res = await axiosInstance.get(qs ? `/lecturers?${qs}` : '/lecturers');
    return res.data;
  }

  const res = await axiosInstance.get('/lecturers', { params });
  return res.data;
}

export async function getLecturerDetail(id) {
  const res = await axiosInstance.get(`/lecturers/${id}/detail`);
  return res.data;
}

export async function deleteLecturer(id) {
  const res = await axiosInstance.delete(`/lecturers/${id}`);
  return res.data;
}

export async function toggleLecturerStatus(id) {
  const res = await axiosInstance.patch(`/lecturers/${id}/status`);
  return res.data; // expects { status }
}

export async function updateLecturerProfile(id, payload) {
  const res = await axiosInstance.patch(`/lecturers/${id}/profile`, payload);
  return res.data;
}

export async function updateLecturer(id, payload) {
  const res = await axiosInstance.put(`/lecturers/${id}`, payload);
  return res.data;
}

export async function uploadLecturerPayroll(id, file) {
  const fd = new FormData();
  fd.append('payroll', file);
  const res = await axiosInstance.post(`/lecturers/${id}/payroll`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function updateLecturerCourses(id, course_ids) {
  const res = await axiosInstance.put(`/lecturers/${id}/courses`, { course_ids });
  return res.data;
}

export async function updateCandidateHourlyRate(candidateId, hourlyRate) {
  const res = await axiosInstance.patch(`/candidates/${candidateId}` , { hourlyRate });
  return res.data;
}

export async function createLecturer(payload) {
  const res = await axiosInstance.post('/lecturers', payload);
  return res.data;
}

export async function createLecturerFromCandidate(candidateId, payload) {
  const res = await axiosInstance.post(`/lecturers/from-candidate/${candidateId}`, payload);
  return res.data;
}

export const importLecturersFromExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axiosInstance.post('/lecturers/import/excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
