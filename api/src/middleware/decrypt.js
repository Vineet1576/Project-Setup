const forge = require("node-forge");
const url = require("url");
const querystring = require("querystring");
const { ENCRYPTION_IV, SECRET_KEY, CRYPTO_SECURE_ENCRYPTION } = process.env;

const useCryptoSecure = CRYPTO_SECURE_ENCRYPTION === "true";
const isValidHex = (str) => /^[0-9a-fA-F]+$/.test(str);

module.exports = async (req, res, next) => {
  if (useCryptoSecure) return next();

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
      }
    }

    next();
  } catch (err) {
    console.error("Decryption error:", err.message);
    res.status(400).json({ error: "Decryption failed" });
  }
};
