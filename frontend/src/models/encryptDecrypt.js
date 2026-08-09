let csInstance = null;
let useCryptoSecure = false;
let secretKey = '';
let encryptionIv = '';
let configLoaded = false;

const _encoder = new TextEncoder();
const _decoder = new TextDecoder();

const _isValidHex = (str) =>
  typeof str === 'string' && /^[0-9a-fA-F]+$/.test(str) && str.length % 2 === 0;

const _hexToBytes = (hex) => {
  const len = hex.length / 2;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};

const _bytesToHex = (bytes) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const _importAesKey = async (keyStr) =>
  crypto.subtle.importKey(
    'raw',
    _encoder.encode(keyStr),
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt'],
  );

const _aesEncryptHex = async (data, keyStr, ivStr) => {
  const cryptoKey = await _importAesKey(keyStr);
  const iv = _encoder.encode(ivStr);
  const plaintext = _encoder.encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    cryptoKey,
    plaintext,
  );
  return _bytesToHex(new Uint8Array(encrypted));
};

const _aesDecryptHex = async (hexData, keyStr, ivStr) => {
  const cryptoKey = await _importAesKey(keyStr);
  const iv = _encoder.encode(ivStr);
  const encryptedBytes = _hexToBytes(hexData);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    cryptoKey,
    encryptedBytes,
  );
  return JSON.parse(_decoder.decode(new Uint8Array(decrypted)));
};

export const isCryptoSecure = () => useCryptoSecure && !!csInstance;

export async function initEncryption(baseUrl = '') {
  if (configLoaded) {
    if (useCryptoSecure) {
      await _setupCryptoSecure(baseUrl);
    }
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/settings/crypto`);
    if (res.ok) {
      const cfg = await res.json();
      useCryptoSecure = cfg.CRYPTO_SECURE_ENCRYPTION === 'true';
      secretKey = cfg.SECRET_KEY || '';
      encryptionIv = cfg.ENCRYPTION_IV || '';
    } else {
      useCryptoSecure = false;
    }
  } catch {
    useCryptoSecure = false;
  }

  configLoaded = true;

  if (!useCryptoSecure) {
    return;
  }

  await _setupCryptoSecure(baseUrl);
}

async function _setupCryptoSecure(baseUrl) {
  try {
    const cs = await import('crypto-secure/client');
    cs.clearServerPublicKeyCache();
    const serverKey = await cs.fetchServerPublicKey(`${baseUrl}/.well-known/encryption-key`);
    const clientKeys = await cs.generateECDHKeyPair();
    csInstance = { cs, serverKey, clientKeys };
  } catch {
    csInstance = null;
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
  if (!useCryptoSecure && secretKey && encryptionIv) {
    try {
      return { data: await _aesEncryptHex(payload, secretKey, encryptionIv) };
    } catch {
      return payload;
    }
  }
  return payload;
}

export async function encryptParams(params) {
  if (csInstance) {
    const encrypted = csInstance.cs.encrypt(params, csInstance.serverKey);
    return { data: JSON.stringify(encrypted) };
  }
  if (!useCryptoSecure && secretKey && encryptionIv) {
    try {
      return { data: await _aesEncryptHex(params, secretKey, encryptionIv) };
    } catch {
      return { data: JSON.stringify(params) };
    }
  }
  return { params };
}

export async function decryptResponse(data) {
  if (csInstance && data && (data.encryptedAESKey || data.epk)) {
    return csInstance.cs.decrypt(data, csInstance.clientKeys.privateKey);
  }
  if (
    !useCryptoSecure &&
    secretKey &&
    encryptionIv &&
    data &&
    typeof data.data === 'string' &&
    _isValidHex(data.data)
  ) {
    try {
      const decrypted = await _aesDecryptHex(data.data, secretKey, encryptionIv);
      const result = { ...data };
      delete result.data;
      return { ...result, ...decrypted };
    } catch {
      return data;
    }
  }
  return data;
}
