import axios from '../lib/axios';

export async function listResearchFields() {
  const res = await axios.get('/research-fields');
  return res.data;
}

export async function createResearchField(name) {
  const res = await axios.post('/research-fields', { name });
  return res.data;
}

export default { listResearchFields, createResearchField };
