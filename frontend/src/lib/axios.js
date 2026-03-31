import axios from 'axios';

// Prefer env, fallback to local default to preserve behavior
export const API_BASE_URL = import.meta?.env?.VITE_API_URL || 'http://localhost:4000/api';

export const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Include credentials for CORS requests
    headers: {
        Accept: 'application/json',
    },
});

// Optional: caller can set/clear Authorization without coupling to storage
export function setAuthToken(token) {
    if (token) axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export function clearAuthToken() {
    delete axiosInstance.defaults.headers.common.Authorization;
}

export default axiosInstance;