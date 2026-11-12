import client from './client.js';

export const dashboardApi = {
  getSummary: (params) => client.get('/dashboard/summary', { params }),
};
