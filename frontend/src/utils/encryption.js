let mode = null;
let csInstance = null;

const useCryptoSecure = import.meta.env.VITE_CRYPTO_SECURE_ENCRYPTION === 'true';

export async function initEncryption(baseUrl = '') {
  if (!useCryptoSecure) {
    mode = 'legacy';
    return 'legacy';
  }

  try {
    const cs = await import('crypto-secure/client');
    const serverKey = await cs.fetchServerPublicKey(`${baseUrl}/.well-known/encryption-key`);
    const clientKeys = await cs.generateKeyPair();
    csInstance = { cs, serverKey, clientKeys };
    mode = 'crypto-secure';
    return 'crypto-secure';
  } catch {
    mode = 'legacy';
    return 'legacy';
  }
}

export function getEncryptionHeaders() {
  if (csInstance) {
    return csInstance.cs.getClientHeader(csInstance.clientKeys.publicKey);
  }
  return {};
}

export async function encryptRequest(payload) {
  if (csInstance) {
    return csInstance.cs.encrypt(payload, csInstance.serverKey);
  }
  return payload;
}

export async function decryptResponse(data) {
  if (csInstance && data && data.encryptedAESKey) {
    return csInstance.cs.decrypt(data, csInstance.clientKeys.privateKey);
  }
  return data;
}

export function getEncryptionMode() {
  return mode;
}
