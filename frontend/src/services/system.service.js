import { axiosInstance } from '../lib/axios';

export async function getHealth() {
  const res = await axiosInstance.get('/health');
  return res.data;
}

export async function sendPresence(department) {
  // fire-and-forget style; callers can ignore return
  const body = department ? { department } : {};
  const res = await axiosInstance.post('/dashboard/presence', body);
  return res.data;
}
