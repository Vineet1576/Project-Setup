import client from './apiClient';

export const rolesApi = {
  list: (params) => client.get('/roles/listing', { params }),
  create: (data) => client.post('/roles/add', data),
  update: (data) => client.put('/roles/update', data),
  changeStatus: (data) => client.put('/roles/status/change', data),
  delete: (data) => client.delete('/roles/delete', { data }),
};
