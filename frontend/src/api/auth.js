import client from './client';

export const authApi = {
  login: (data) => client.post('/users/login', data),
  register: (data) => client.post('/users/register', data),
  verifyOtp: (data) => client.post('/users/verify-otp', data),
  resendOtp: (data) => client.put('/users/resend-otp', data),
  forgotPassword: (data) => client.post('/users/forgot-password', data),
  resetPassword: (data) => client.put('/users/reset-password', data),
  setPassword: (data) => client.post('/users/set-password', data),
  autoLogin: () => client.post('/users/auto-login'),
  logout: (data) => client.post('/users/logout', data),
  getProfile: () => client.get('/users/profile'),
  updateProfile: (data) => client.put('/users/edit-profile', data),
};
