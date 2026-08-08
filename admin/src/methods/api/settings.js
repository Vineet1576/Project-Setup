import client from './apiClient';

export const settingsApi = {
  get: () => client.get('/settings'),
  update: (data) => client.put('/settings', data),
};
