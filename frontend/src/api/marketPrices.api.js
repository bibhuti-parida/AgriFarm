import client from './client.js';

export const marketPricesApi = {
  list: (params) => client.get('/market-prices', { params }),
  getLatest: (params) => client.get('/market-prices/latest', { params }),
  sync: () => client.post('/market-prices/sync'),
};
