import client from './apiClient';

export const feedbackApi = {
  list: (params) => client.get('/feedback/listing', { params }),
  getById: ({ id }) => client.get(`/feedback/detail?id=${encodeURIComponent(id || '')}`),
  changeStatus: (data) => client.put('/feedback/status/change', data),
  reply: (data) => client.post('/feedback/reply', data),
  delete: (data) => client.delete('/feedback/delete', { params: data }),
};
