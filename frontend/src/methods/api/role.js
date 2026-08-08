import client from './apiClient';

export const roleApi = {
  getFrontendRoles: () => client.get('/roles/frontend-list'),
};
