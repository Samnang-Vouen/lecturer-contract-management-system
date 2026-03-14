import axios from '../lib/axios';

export async function checkAuth() {
  const res = await axios.get('/auth/check');
  return res.data;
}

export async function login(credentials) {
  const res = await axios.post('/auth/login', credentials);
  return res.data;
}

export async function logout() {
  const res = await axios.post('/auth/logout');
  return res.data;
}

export async function forgotPassword(email) {
  const res = await axios.post('/auth/forgot-password', { email });
  return res.data;
}

export async function resetPassword(token, newPassword) {
  const res = await axios.post('/auth/reset-password', { token, newPassword });
  return res.data;
}

export default { checkAuth, login, logout, forgotPassword, resetPassword };
