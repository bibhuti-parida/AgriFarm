import client from './client.js';

export const reportsApi = {
  getProductionReport: (params) => client.get('/reports/production', { params }),
  getExpensesReport: (params) => client.get('/reports/expenses', { params }),
  getProfitabilityReport: (params) => client.get('/reports/profitability', { params }),
};
