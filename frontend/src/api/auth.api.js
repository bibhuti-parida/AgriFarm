import client from './client.js';

export const authApi = {
  login: (data) => client.post('/auth/login', data),
  register: (data) => client.post('/auth/register', data),
  getMe: () => client.get('/auth/me'),
  updateMe: (data) => client.patch('/auth/me', data),
  changePassword: (data) => client.post('/auth/change-password', data),
  forgotPassword: (data) => client.post('/auth/forgot-password', data),
  resetPassword: (data) => client.post('/auth/reset-password', data),
};
