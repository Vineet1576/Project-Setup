import client from './apiClient';

export const feedbackApi = {
  list: (params) => client.get('/feedback/listing', { params }),
  detail: (data) => client.get('/feedback/detail', { params: data }),
};
