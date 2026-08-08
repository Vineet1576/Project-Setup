import client from './apiClient';

export const categoriesApi = {
  list: (params) => client.get('/category/listing', { params }),
  getById: (data) => client.get('/category/detail', { params: data }),
  create: (data) => client.post('/category/add', data),
  update: (data) => client.put('/category/update', data),
  changeStatus: (data) => client.put('/category/status/change', data),
  delete: (data) => client.delete('/category/delete', { params: data }),
};
