import client from './client.js';

export const cropsApi = {
  // Crop catalog
  listCatalog: (params) => client.get('/crops', { params }),
  getCropById: (id) => client.get(`/crops/${id}`),

  // Crop Cycles
  listCycles: (params) => client.get('/crop-cycles', { params }),
  getCycleById: (id) => client.get(`/crop-cycles/${id}`),
  createCycle: (data) => client.post('/crop-cycles', data),
  updateCycle: (id, data) => client.patch(`/crop-cycles/${id}`, data),
  deleteCycle: (id) => client.delete(`/crop-cycles/${id}`),
};
