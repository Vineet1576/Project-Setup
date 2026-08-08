import client from './apiClient';

export const contactUsApi = {
  list: (params) => client.get('/feedback/listing', { params }),
  getById: (data) => client.get('/feedback/detail', { params: data }),
  changeStatus: (data) => client.put('/feedback/status/change', { params: data }),
  reply: (data) => client.post('/feedback/reply', data),
  delete: (data) => client.delete('/feedback/delete', { params: data }),
};
