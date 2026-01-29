import axios from '../lib/axios';

export async function listMajors() {
  const res = await axios.get('/majors');
  return res.data;
}

export async function createMajor(name) {
  const res = await axios.post('/majors', { name });
  return res.data;
}

export default { listMajors, createMajor };
