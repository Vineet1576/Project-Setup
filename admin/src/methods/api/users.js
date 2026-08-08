import client from './apiClient';

export const usersApi = {
  list: (params) => client.get('/users/user-listing', { params }),
  getById: (data) => client.get('/users/detail', { params: data }),
  create: (data) => client.post('/users/add-user', data),
  update: (data) => client.put('/users/update-profile', data),
  changeApprovalStatus: (data) => client.put('/users/approval-status', data),
  changeStatus: (data) => client.put('/users/change-status', data),
  delete: (data) => client.delete('/users/delete', { params: data }),
};
