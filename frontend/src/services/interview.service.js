import { axiosInstance } from '../lib/axios';

export async function getInterviewQuestions(params = { defaultOnly: 1 }) {
  const res = await axiosInstance.get('/interview-questions', { params });
  return res.data; // expects { categories }
}

export async function addInterviewQuestion(payload) {
  const res = await axiosInstance.post('/interview-questions', payload);
  return res.data; // { id, question_text, ... }
}

export async function updateInterviewQuestion(id, payload) {
  const res = await axiosInstance.put(`/interview-questions/${id}`, payload);
  return res.data;
}

export async function deleteInterviewQuestion(id) {
  const res = await axiosInstance.delete(`/interview-questions/${id}`);
  return res.data;
}

export async function searchInterviewQuestions(query) {
  const res = await axiosInstance.get('/interview-questions/search', { params: { query } });
  return res.data; // array
}

export async function saveCandidateQuestion(candidate_id, question_id, data) {
  // data can be { rating } or { noted }
  const res = await axiosInstance.post('/interview-questions/candidate-questions', {
    candidate_id,
    question_id,
    ...data,
  });
  return res.data;
}

export async function getCandidateInterviewDetails(candidateId) {
  const res = await axiosInstance.get(`/interview-questions/candidates/${candidateId}/interview-details`);
  return res.data; // expected interview detail object
}
