import { axiosInstance } from '../lib/axios';

export async function listContracts(params) {
  const res = await axiosInstance.get('/teaching-contracts', { params });
  return res.data;
}

export async function createContract(payload) {
  const res = await axiosInstance.post('/teaching-contracts', payload);
  return res.data;
}

export async function deleteContract(id) {
  await axiosInstance.delete(`/teaching-contracts/${id}`);
}

export async function getContractPdfBlob(id) {
  const res = await axiosInstance.get(`/teaching-contracts/${id}/pdf`, { responseType: 'blob' });
  return res.data;
}

export function getContractPdfUrl(id) {
  return `${axiosInstance.defaults.baseURL}/teaching-contracts/${id}/pdf`;
}

export async function uploadContractSignature(id, file, who = 'lecturer') {
  const form = new FormData();
  form.append('file', file);
  form.append('who', who);
  const res = await axiosInstance.post(`/teaching-contracts/${id}/signature`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function updateContractStatus(id, status) {
  const res = await axiosInstance.patch(`/teaching-contracts/${id}/status`, { status });
  return res.data;
}
