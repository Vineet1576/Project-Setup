import client from './apiClient';

export const dashboardApi = {
  stats: (params) => client.get('/admin-dashboard/stats', { params }),
};
