import client from './apiClient';

export const authApi = {
  login: (data) => client.post('/users/login', data),
  register: (data) => client.post('/users/register', data),
  forgotPassword: (data) => client.post('/users/forgot-password', data),
  resetPassword: (data) => client.put('/users/reset-password', data),
  autoLogin: (data) => client.post('/users/auto/login', data),
  logout: (data) => client.post('/users/logout-user', data),
  getProfile: (data) => client.get('/users/detail', { params: data }),
  updateProfile: (data) => client.put('/users/update-profile', data),
  changePassword: (data) => client.put('/users/change-password', data),
  uploadImage: (imageBase64) => client.post('/upload/image-base64', { imageBase64 }),
};
