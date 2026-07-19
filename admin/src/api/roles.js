import client from './client';

export const rolesApi = {
  list: (params) => client.get('/roles/list', { params }),
  create: (data) => client.post('/roles/add', data),
  update: (data) => client.put('/roles/edit', data),
  delete: (data) => client.delete('/roles/delete', { data }),
};
