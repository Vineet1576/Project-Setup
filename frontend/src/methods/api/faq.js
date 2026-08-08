import client from './apiClient';

export const faqApi = {
  list: () => client.get('/faqs/list'),
};
