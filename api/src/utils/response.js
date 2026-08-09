const forge = require("node-forge");

const _encrypt = (data, secretKey, encryptionIv) => {
  const cipher = forge.cipher.createCipher(
    "AES-CBC",
    forge.util.createBuffer(secretKey, "utf8"),
  );
  cipher.start({ iv: forge.util.createBuffer(encryptionIv, "utf8") });
  cipher.update(forge.util.createBuffer(JSON.stringify(data), "utf8"));
  cipher.finish();
  return cipher.output.toHex();
};

const _decrypt = (encrypted, secretKey, encryptionIv) => {
  const decipher = forge.cipher.createDecipher(
    "AES-CBC",
    forge.util.createBuffer(secretKey, "utf8"),
  );
  decipher.start({ iv: forge.util.createBuffer(encryptionIv, "utf8") });
  decipher.update(forge.util.createBuffer(forge.util.hexToBytes(encrypted)));
  decipher.finish();
  return JSON.parse(decipher.output.toString("utf8"));
};

const _base64Encode = (value) =>
  Buffer.from(
    encodeURIComponent(
      typeof value === "string" ? value : JSON.stringify(value),
    ),
    "utf8",
  )
    .toString("base64")
    .replace(/=/g, "");

const _base64Decode = (value) => {
  if (!value) return "";
  const pad = "=".repeat((4 - (value.length % 4)) % 4);
  return decodeURIComponent(
    Buffer.from(value + pad, "base64").toString("utf8"),
  );
};

const _getCryptoEnv = () => ({
  ENCRYPTION_IV: process.env.ENCRYPTION_IV,
  SECRET_KEY: process.env.SECRET_KEY,
  CRYPTO_SECURE_ENCRYPTION: process.env.CRYPTO_SECURE_ENCRYPTION,
  CRYPTO_SECURE_PUBLIC_KEY: process.env.CRYPTO_SECURE_PUBLIC_KEY,
  CRYPTO_SECURE_PRIVATE_KEY: process.env.CRYPTO_SECURE_PRIVATE_KEY,
});

exports.encryptData = (data) => {
  const {
    ENCRYPTION_IV,
    SECRET_KEY,
    CRYPTO_SECURE_ENCRYPTION,
    CRYPTO_SECURE_PUBLIC_KEY,
  } = _getCryptoEnv();
  const useCryptoSecure =
    typeof CRYPTO_SECURE_ENCRYPTION === 'string' &&
    CRYPTO_SECURE_ENCRYPTION.toLowerCase() === 'true';

  try {
    if (useCryptoSecure) {
      if (!CRYPTO_SECURE_PUBLIC_KEY) return data;
      const cs = require("crypto-secure");
      const encrypted = cs.encrypt(data, CRYPTO_SECURE_PUBLIC_KEY);
      return _base64Encode(encrypted);
    }
    if (!SECRET_KEY || !ENCRYPTION_IV) return data;
    return _encrypt(data, SECRET_KEY, ENCRYPTION_IV);
  } catch (error) {
    console.warn("Encryption error:", error);
    return data;
  }
};

exports.decryptData = (encrypted) => {
  if (!encrypted) throw new Error("No data provided for decryption");

  const {
    ENCRYPTION_IV,
    SECRET_KEY,
    CRYPTO_SECURE_ENCRYPTION,
    CRYPTO_SECURE_PRIVATE_KEY,
  } = _getCryptoEnv();
  const useCryptoSecure =
    typeof CRYPTO_SECURE_ENCRYPTION === 'string' &&
    CRYPTO_SECURE_ENCRYPTION.toLowerCase() === 'true';

  if (useCryptoSecure) {
    if (!CRYPTO_SECURE_PRIVATE_KEY)
      throw new Error("Missing CRYPTO_SECURE_PRIVATE_KEY");
    const cs = require("crypto-secure");
    const parsed = JSON.parse(_base64Decode(encrypted));
    return cs.decrypt(parsed, CRYPTO_SECURE_PRIVATE_KEY);
  }

  if (!ENCRYPTION_IV || !SECRET_KEY)
    throw new Error("Missing SECRET_KEY or ENCRYPTION_IV");

  return _decrypt(encrypted, SECRET_KEY, ENCRYPTION_IV);
};

exports.success = (payload = {}, message = "", req, res) => {
  const statusCode = 200;
  const {
    ENCRYPTION_IV,
    SECRET_KEY,
    CRYPTO_SECURE_ENCRYPTION,
  } = _getCryptoEnv();
  const useCryptoSecure = CRYPTO_SECURE_ENCRYPTION === "true";

  if (useCryptoSecure) {
    if (typeof payload === "string") {
      return res.status(statusCode).json({
        success: true,
        code: statusCode,
        message,
        data: payload,
      });
    }
    return res.status(statusCode).json({
      success: true,
      code: statusCode,
      message,
      ...payload,
    });
  }

  let encryptedPayload = payload;

  if (payload && req && req.hostname !== "localhost") {
    try {
      if (SECRET_KEY && ENCRYPTION_IV) {
        encryptedPayload = _encrypt(payload, SECRET_KEY, ENCRYPTION_IV);
      }
    } catch (error) {
      console.warn("Encryption error:", error);
    }
  }

  if (typeof encryptedPayload === "string") {
    return res.status(statusCode).json({
      success: true,
      code: statusCode,
      message,
      data: encryptedPayload,
    });
  }

  return res.status(statusCode).json({
    success: true,
    code: statusCode,
    message,
    ...encryptedPayload,
  });
};
