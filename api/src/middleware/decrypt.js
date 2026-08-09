const forge = require("node-forge");
const url = require("url");
const querystring = require("querystring");
const CryptoSecure = require("crypto-secure");
const { settingRepo } = require("../repositories");

const isValidHex = (str) => /^[0-9a-fA-F]+$/.test(str);

const getCryptoConfig = async () => {
  const settings = await settingRepo.getGlobal();
  const config = (settings && settings.config) || {};
  return {
    ENCRYPTION_IV: config.ENCRYPTION_IV || "",
    SECRET_KEY: config.SECRET_KEY || "",
    CRYPTO_SECURE_ENCRYPTION: config.CRYPTO_SECURE_ENCRYPTION || "",
  };
};

module.exports = async (req, res, next) => {
  const {
    ENCRYPTION_IV: dbIv,
    SECRET_KEY: dbSecretKey,
    CRYPTO_SECURE_ENCRYPTION: dbCryptoSecure,
  } = await getCryptoConfig();
  const ENCRYPTION_IV = dbIv || process.env.ENCRYPTION_IV;
  const SECRET_KEY = dbSecretKey || process.env.SECRET_KEY;
  const CRYPTO_SECURE_ENCRYPTION = dbCryptoSecure || process.env.CRYPTO_SECURE_ENCRYPTION;
  const CRYPTO_SECURE_PRIVATE_KEY = process.env.CRYPTO_SECURE_PRIVATE_KEY;
  const useCryptoSecure =
    typeof CRYPTO_SECURE_ENCRYPTION === 'string' &&
    CRYPTO_SECURE_ENCRYPTION.toLowerCase() === 'true';

  if (useCryptoSecure) {
    try {
      const dataParam = req.query && req.query.data;
      if (dataParam) {
        let payload = dataParam;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch {
            payload = null;
          }
        }
        if (payload && CryptoSecure.isEncrypted(payload)) {
          req.decryptedParams = CryptoSecure.decrypt(
            payload,
            CRYPTO_SECURE_PRIVATE_KEY,
          );
        } else if (payload && typeof payload === "object" && !Array.isArray(payload)) {
          req.decryptedParams = payload;
        }
      }
    } catch (err) {
      console.error("Decryption error:", err.message);
      return res.status(400).json({ error: "Decryption failed" });
    }
    return next();
  }

  const iv = ENCRYPTION_IV;
  const secretKey = SECRET_KEY;

  try {
    if (!secretKey || !iv) {
      return next();
    }

    if (req.body && req.body.data) {
      const decipher = forge.cipher.createDecipher("AES-CBC", secretKey);
      decipher.start({ iv });
      decipher.update(
        forge.util.createBuffer(forge.util.hexToBytes(req.body.data)),
      );
      const success = decipher.finish();

      if (!success) {
        throw new Error("Decryption failed");
      }

      const decryptedStr = decipher.output.toString("utf8");
      req.body = JSON.parse(decryptedStr);
    }

    let params = req.originalUrl.split("=");
    params = params[1];
    if (params) {
      if (isValidHex(params)) {
        const decipher = forge.cipher.createDecipher("AES-CBC", secretKey);
        decipher.start({ iv });
        decipher.update(forge.util.createBuffer(forge.util.hexToBytes(params)));
        const success = decipher.finish();

        if (success) {
          const decryptedStr = decipher.output.toString("utf8");
          req.decryptedParams = JSON.parse(decryptedStr);
        }
      } else {
        const parsedUrl = url.parse(req.originalUrl);
        const queryParams = querystring.parse(parsedUrl.query);
        req.decryptedParams = queryParams;
        if (typeof queryParams.data === "string") {
          try {
            const parsed = JSON.parse(queryParams.data);
            if (parsed && typeof parsed === "object") {
              req.decryptedParams = parsed;
            }
          } catch {
            // keep raw queryParams
          }
        }
      }
    }

    next();
  } catch (err) {
    console.error("Decryption error:", err.message);
    res.status(400).json({ error: "Decryption failed" });
  }
};
