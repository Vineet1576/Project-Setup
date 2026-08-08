import client from './apiClient';

export const authApi = {
  login: (data) => client.post('/users/admin/login', data),
  autoLogin: (data) => client.post('/users/auto/login', data),
  logout: (data) => client.post('/users/logout-user', data),
  updateProfile: (data) => client.put('/users/update-profile', data),
  changePassword: (data) => client.put('/users/change-password', data),
  uploadImage: (imageBase64) => client.post('/upload/image-base64', { imageBase64 }),
};
