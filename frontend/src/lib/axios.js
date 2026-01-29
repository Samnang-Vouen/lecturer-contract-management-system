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

// Basic pass-through interceptors, reserved for future instrumentation
axiosInstance.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log 401/403 errors to help with debugging
        if (error.response?.status === 401) {
            console.error('[axios] 401 Unauthorized:', error.config?.url);
        } else if (error.response?.status === 403) {
            console.error('[axios] 403 Forbidden:', error.config?.url);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;