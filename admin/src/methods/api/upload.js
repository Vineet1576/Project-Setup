import client from './apiClient';

export const uploadApi = {
  imageBase64: (imageBase64) => client.post('/upload/image-base64', { imageBase64 }),
};
