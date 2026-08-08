import client from './apiClient';

export const transactionsApi = {
  list: (params) => client.get('/transactions/listing', { params }),
  analytics: (params) => client.get('/transactions/analytics', { params }),
  sendInvoice: (data) => client.post('/transactions/send-invoice', data),
  download: (data) => client.get('/transactions/download', { params: data, responseType: 'blob' }),
};
