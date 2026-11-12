import axios from 'axios';

export const API_BASE_URL = '/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach Bearer token if present in localStorage
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agrifarm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap response or normalize error
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const res = error.response;
    if (res?.status === 401) {
      // Clear token on authentication failure
      localStorage.removeItem('agrifarm_token');
      localStorage.removeItem('agrifarm_user');

      // If user is currently on an authenticated page, redirect to login
      if (
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register') &&
        !window.location.pathname.startsWith('/forgot-password') &&
        !window.location.pathname.startsWith('/reset-password')
      ) {
        window.location.href = '/login';
      }
    }

    const customMessage = res?.data?.message || error.message || 'Something went wrong';
    const errorDetails = res?.data?.error?.details || null;
    const errorCode = res?.data?.error?.code || 'NETWORK_ERROR';

    const enhancedError = new Error(customMessage);
    enhancedError.code = errorCode;
    enhancedError.details = errorDetails;
    enhancedError.status = res?.status;

    return Promise.reject(enhancedError);
  }
);

export default client;
