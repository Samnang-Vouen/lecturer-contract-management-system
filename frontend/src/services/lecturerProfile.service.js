import axios from '../lib/axios';

export async function getMyLecturerProfile() {
  const res = await axios.get('/lecturer-profile/me');
  return res.data;
}

export async function updateMyLecturerProfile(payload) {
  const res = await axios.put('/lecturer-profile/me', payload);
  return res.data;
}

export async function uploadLecturerFiles({ cv, syllabus }) {
  const fd = new FormData();
  if (cv) fd.append('cv', cv);
  if (syllabus) fd.append('syllabus', syllabus);
  const res = await axios.post('/lecturer-profile/me/files', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getMyCandidateContact() {
  const res = await axios.get('/lecturer-profile/me/candidate-contact');
  return res.data;
}

export async function getCandidatesDoneSinceLogin() {
  const res = await axios.get('/lecturer-profile/candidates-done-since-login');
  return res.data;
}

export async function getCandidatesDoneSinceLoginOptimized() {
  const res = await axios.get('/lecturer-profile/candidates-done-since-login-optimized');
  return res.data;
}

export async function submitLecturerOnboarding(formData) {
  const res = await axios.post('/lecturers/onboarding', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getLecturerOnboardingStatus() {
  const res = await axios.get('/lecturers/onboarding/status');
  return res.data;
}
