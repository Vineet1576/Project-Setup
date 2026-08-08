import client from './apiClient';

export const notificationsApi = {
  list: (params) => client.get('/notifications/list', { params }),
  markRead: (data) => client.put('/notifications/read', data),
  markAllRead: (data) => client.put('/notifications/read-all', data),
  dismiss: (data) => client.put('/notifications/dismiss', data),
  broadcast: (data) => client.post('/notifications/broadcast', data),
};
