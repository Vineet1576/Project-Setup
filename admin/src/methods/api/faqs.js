import client from './apiClient';

export const faqsApi = {
  list: (params) => client.get('/faqs/listing', { params }),
  getById: (data) => client.get('/faqs/detail', { params: data }),
  create: (data) => client.post('/faqs/add', data),
  update: (data) => client.put('/faqs/update', data),
  changeStatus: (data) => client.put('/faqs/status/change', data),
  delete: (data) => client.delete('/faqs/delete', { params: data }),
  categories: () => client.get('/faqs/categories'),
};
