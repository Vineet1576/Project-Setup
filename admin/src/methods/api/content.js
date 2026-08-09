import client from './apiClient';

export const contentApi = {
  list: (params) => client.get('/content-management/listing', { params }),
  getById: (data) => client.get('/content-management/detail', { params: data }),
  create: (data) => client.post('/content-management/add', data),
  update: (data) => client.put('/content-management/update', data),
  changeStatus: (data) => client.put('/content-management/status/change', data),
  delete: (data) => client.delete('/content-management/delete', { params: data }),
};
