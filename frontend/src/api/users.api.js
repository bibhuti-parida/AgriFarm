import client from './client.js';

export const usersApi = {
  list: (params) => client.get('/users', { params }),
};
