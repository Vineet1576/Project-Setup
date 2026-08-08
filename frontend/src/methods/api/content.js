import client from './apiClient';

export const contentApi = {
  sendContact: (data) => client.post('/feedback/add', data),
  getContent: (title) => client.get('/content-management/detail', { params: { title } }),
};
