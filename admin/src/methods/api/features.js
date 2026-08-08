import client from './apiClient';

export const featuresApi = {
  list: (params) => client.get('/features/list', { params }),
  getById: (data) => client.get('/features/detail', { params: data }),
  create: (data) => client.post('/features/add', data),
  update: (data) => client.put('/features/update', data),
  changeStatus: (data) => client.put('/features/status/change', data),
  delete: (data) => client.delete('/features/delete', { params: data }),
};
