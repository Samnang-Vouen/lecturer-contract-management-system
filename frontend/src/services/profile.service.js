import axios from '../lib/axios';

export const getMyProfile = () => axios.get('/profile/me');
export const getMyActivity = () => axios.get('/profile/activity');
export const changeMyPassword = (payload) => axios.post('/profile/change-password', payload);
