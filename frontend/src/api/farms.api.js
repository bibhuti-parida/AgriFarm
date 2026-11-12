import client from './client.js';

export const farmsApi = {
  list: (params) => client.get('/farms', { params }),
  getById: (id) => client.get(`/farms/${id}`),
  create: (data) => client.post('/farms', data),
  update: (id, data) => client.patch(`/farms/${id}`, data),
  delete: (id) => client.delete(`/farms/${id}`),
};
