import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export { API_BASE };

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

let encryptionReady = false;
let initPromise = null;

function getToken() {
  try {
    const auth = JSON.parse(sessionStorage.getItem('auth') || '{}');
    return auth.token || null;
  } catch {
    return null;
  }
}

async function ensureEncryption() {
  if (encryptionReady) return;
  if (initPromise) return initPromise;
  const { initEncryption } = await import('../../models/encryptDecrypt');
  initPromise = initEncryption(API_BASE).then(() => {
    encryptionReady = true;
  });
  return initPromise;
}

client.interceptors.request.use(async (config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  await ensureEncryption();

  const { getEncryptionHeaders, encryptRequest, encryptParams } =
    await import('../../models/encryptDecrypt');

  const headers = getEncryptionHeaders();
  if (headers['x-encryption-key']) {
    config.headers['x-encryption-key'] = headers['x-encryption-key'];
  }

  if (config.data && encryptionReady) {
    config.data = await encryptRequest(config.data);
  }

  if (config.params && encryptionReady && !config.data) {
    config.params = await encryptParams(config.params);
  }
  return config;
});

client.interceptors.response.use(
  async (response) => {
    const { decryptResponse } = await import('../../models/encryptDecrypt');
    if (response.data) {
      response.data = await decryptResponse(response.data);
    }
    return response;
  },
  async (error) => {
    const { decryptResponse } = await import('../../models/encryptDecrypt');
    if (error.response?.data) {
      error.response.data = await decryptResponse(error.response.data);
    }
    return Promise.reject(error);
  },
);

export default client;
