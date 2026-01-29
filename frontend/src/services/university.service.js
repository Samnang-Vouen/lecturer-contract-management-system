import axios from '../lib/axios';

export async function listUniversities() {
  const res = await axios.get('/universities');
  return res.data;
}

export async function createUniversity(name) {
  const res = await axios.post('/universities', { name });
  return res.data;
}

export default { listUniversities, createUniversity };
