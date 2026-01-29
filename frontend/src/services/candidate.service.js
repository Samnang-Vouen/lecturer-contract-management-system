import { axiosInstance } from '../lib/axios';

export async function listCandidates(params = {}) {
  const res = await axiosInstance.get('/candidates', { params });
  return res.data; // expects { data, page, hasMore }
}

export async function createCandidate(payload) {
  const res = await axiosInstance.post('/candidates', payload);
  return res.data; // created candidate object
}

export async function updateCandidate(id, payload) {
  const res = await axiosInstance.patch(`/candidates/${id}`, payload);
  return res.data; // updated candidate
}

export async function deleteCandidate(id) {
  const res = await axiosInstance.delete(`/candidates/${id}`);
  return res.data;
}
