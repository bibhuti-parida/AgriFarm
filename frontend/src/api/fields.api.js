import client from './client.js';

export const fieldsApi = {
  listByFarm: (farmId, params) => client.get(`/farms/${farmId}/fields`, { params }),
  createOnFarm: (farmId, data) => client.post(`/farms/${farmId}/fields`, data),
  getById: (id) => client.get(`/fields/${id}`),
  update: (id, data) => client.patch(`/fields/${id}`, data),
  delete: (id) => client.delete(`/fields/${id}`),
};
