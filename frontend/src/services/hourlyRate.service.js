import { axiosInstance } from '../lib/axios';

export async function listRateHourReport(params) {
  const res = await axiosInstance.get('/hourly-rates/report', { params });
  return res.data;
}

export async function updateRateHourRow(lecturerId, payload) {
  const res = await axiosInstance.put(`/hourly-rates/report/${lecturerId}`, payload);
  return res.data;
}