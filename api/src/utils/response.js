const forge = require("node-forge");
const { ENCRYPTION_IV, SECRET_KEY, CRYPTO_SECURE_ENCRYPTION } = process.env;

const useCryptoSecure = CRYPTO_SECURE_ENCRYPTION === "true";

const _encrypt = (data) => {
  const cipher = forge.cipher.createCipher("AES-CBC", SECRET_KEY);
  cipher.start({ iv: ENCRYPTION_IV });
  cipher.update(forge.util.createBuffer(JSON.stringify(data), "utf8"));
  cipher.finish();
  return cipher.output.toHex();
};

const _decrypt = (encrypted) => {
  const decipher = forge.cipher.createDecipher("AES-CBC", SECRET_KEY);
  decipher.start({ iv: ENCRYPTION_IV });
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

exports.encryptData = (data) => {
  try {
    if (useCryptoSecure) {
      const publicKey = process.env.CRYPTO_SECURE_PUBLIC_KEY;
      if (!publicKey) return data;
      const cs = require("crypto-secure");
      const encrypted = cs.encrypt(data, publicKey);
      return _base64Encode(encrypted);
    }
    if (!SECRET_KEY || !ENCRYPTION_IV) return data;
    return _encrypt(data);
  } catch (error) {
    console.warn("Encryption error:", error);
    return data;
  }
};

exports.decryptData = (encrypted) => {
  if (!encrypted) throw new Error("No data provided for decryption");

  if (useCryptoSecure) {
    const privateKey = process.env.CRYPTO_SECURE_PRIVATE_KEY;
    if (!privateKey) throw new Error("Missing CRYPTO_SECURE_PRIVATE_KEY");
    const cs = require("crypto-secure");
    const parsed = JSON.parse(_base64Decode(encrypted));
    return cs.decrypt(parsed, privateKey);
  }

  if (!ENCRYPTION_IV || !SECRET_KEY)
    throw new Error("Missing SECRET_KEY or ENCRYPTION_IV");

  return _decrypt(encrypted);
};

exports.success = (payload = {}, message = "", req, res) => {
  const statusCode = 200;

  if (useCryptoSecure) {
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
      encryptedPayload = _encrypt(payload);
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

exports.failed = (data = {}, message = "", req, res) => {
  const statusCode = 400;
  return res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message,
      data,
    },
  });
};
