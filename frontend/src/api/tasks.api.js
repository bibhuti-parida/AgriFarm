import client from './client.js';

export const tasksApi = {
  list: (params) => client.get('/tasks', { params }),
  getById: (id) => client.get(`/tasks/${id}`),
  create: (data) => client.post('/tasks', data),
  update: (id, data) => client.patch(`/tasks/${id}`, data),
  complete: (id) => client.patch(`/tasks/${id}/complete`),
  delete: (id) => client.delete(`/tasks/${id}`),
};
