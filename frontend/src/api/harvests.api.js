import client from './client.js';

export const harvestsApi = {
  listAll: (params) => client.get('/harvests', { params }),
  listByCycle: (cropCycleId) => client.get(`/crop-cycles/${cropCycleId}/harvests`),
  createForCycle: (cropCycleId, data) => client.post(`/crop-cycles/${cropCycleId}/harvests`, data),
  getById: (id) => client.get(`/harvests/${id}`),
  update: (id, data) => client.patch(`/harvests/${id}`, data),
  delete: (id) => client.delete(`/harvests/${id}`),
};
