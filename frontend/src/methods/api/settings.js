import client from './apiClient';

export const settingsApi = {
  getPublic: () => client.get('/settings/public'),
};
