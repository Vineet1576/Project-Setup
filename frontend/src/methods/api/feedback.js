import client from './apiClient';

export const feedbackApi = {
  list: (params) => client.get('/feedback/listing', { params }),
  detail: ({ id }) => client.get(`/feedback/detail?id=${encodeURIComponent(id || '')}`),
};
