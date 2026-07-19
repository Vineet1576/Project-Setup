import client from './client';

export const authApi = {
  login: (data) => client.post('/users/admin/login', data),
  autoLogin: () => client.post('/users/auto-login'),
  logout: (data) => client.post('/users/logout', data),
  getProfile: () => client.get('/users/profile'),
};
