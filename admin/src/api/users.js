import client from './client';

export const usersApi = {
  list: (params) => client.get('/users/list', { params }),
  getById: (id) => client.get('/users/profile', { params: { id } }),
  create: (data) => client.post('/users/add', data),
  update: (data) => client.put('/users/edit-profile', data),
  changeStatus: (data) => client.put('/users/change-status', data),
  delete: (data) => client.delete('/users/delete', { data }),
};
