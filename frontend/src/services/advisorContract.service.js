import { axiosInstance } from '../lib/axios';

export async function createAdvisorContract(payload) {
  const res = await axiosInstance.post('/advisor-contracts', payload);
  return res.data;
}

export async function listAdvisorContracts(params) {
  const res = await axiosInstance.get('/advisor-contracts', { params });
  return res.data;
}

export async function getAdvisorContract(id) {
  const res = await axiosInstance.get(`/advisor-contracts/${id}`);
  return res.data;
}

export async function editAdvisorContract(id, payload) {
  const res = await axiosInstance.patch(`/advisor-contracts/${id}`, payload);
  return res.data;
}

export async function updateAdvisorContractStatus(id, status) {
  const res = await axiosInstance.patch(`/advisor-contracts/${id}/status`, { status });
  return res.data;
}

export async function uploadAdvisorContractSignature(id, file, who = 'advisor') {
  const form = new FormData();
  form.append('file', file);
  form.append('who', who);
  const res = await axiosInstance.post(`/advisor-contracts/${id}/signature`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
