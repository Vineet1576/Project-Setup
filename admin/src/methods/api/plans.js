import client from './apiClient';

export const plansApi = {
  list: (params) => client.get('/plans/list', { params }),
  getById: (data) => client.get('/plans/detail', { params: data }),
  create: (data) => client.post('/plans/add', data),
  update: (data) => client.put('/plans/update', data),
  changeStatus: (data) => client.put('/plans/status/change', data),
  delete: (data) => client.delete('/plans/delete', { params: data }),
};
