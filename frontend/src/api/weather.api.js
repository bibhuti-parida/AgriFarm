import client from './client.js';

export const weatherApi = {
  getByFarm: (farmId) => client.get(`/farms/${farmId}/weather`),
  refreshForFarm: (farmId) => client.post(`/farms/${farmId}/weather/refresh`),
};
