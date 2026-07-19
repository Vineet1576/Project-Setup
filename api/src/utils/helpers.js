const crypto = require("crypto");
const mongoose = require("mongoose");

exports.pick = (obj, keys) => {
  const result = {};
  for (const key of keys) {
    if (obj && obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
};

exports.omit = (obj, keys) => {
  const result = { ...obj };
  for (const key of keys) delete result[key];
  return result;
};

exports.generateVerificationCode = (length = 6) => {
  const charset = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += charset[crypto.randomInt(charset.length)];
  }
  return code;
};

exports.generateOTP = (length = 6) => {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += crypto.randomInt(0, 10).toString();
  }
  return otp;
};

exports.generatePassword = (length = 12) => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;
  let password = "";
  password += upper[crypto.randomInt(upper.length)];
  password += lower[crypto.randomInt(lower.length)];
  password += digits[crypto.randomInt(digits.length)];
  password += special[crypto.randomInt(special.length)];
  for (let i = password.length; i < length; i++) {
    password += all[crypto.randomInt(all.length)];
  }
  return password
    .split("")
    .sort(() => crypto.randomInt(2) - 1)
    .join("");
};

exports.generateFileName = (ext = "") => {
  return crypto.randomUUID() + (ext ? `.${ext.replace(/^\./, "")}` : "");
};

exports.trimAndLowercase = (str) => {
  if (!str) return "";
  return str.toString().trim().toLowerCase();
};

exports.createAppError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

exports.calculateDifferenceInDate = (date) => {
  if (!date) return 0;
  const now = new Date();
  const target = new Date(date);
  return Math.floor((now - target) / (1000 * 60 * 60 * 24));
};

exports.parseExcelDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === "number") {
    const utcDays = Math.floor(dateStr - 25569);
    const utcValue = utcDays * 86400;
    return new Date(utcValue * 1000);
  }
  return new Date(dateStr);
};

exports.arrayToChunks = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

exports.parseSortParam = (sortBy, defaultField = "createdAt") => {
  const sort = {};
  if (sortBy) {
    const [field, order] = sortBy.split(" ");
    sort[field] = order === "desc" ? -1 : 1;
  } else {
    sort[defaultField] = -1;
  }
  return sort;
};

exports.sortByKey = (arr, key, order = "asc") => {
  const sorted = [...arr];
  sorted.sort((a, b) => {
    if (a[key] < b[key]) return order === "asc" ? -1 : 1;
    if (a[key] > b[key]) return order === "asc" ? 1 : -1;
    return 0;
  });
  return sorted;
};

exports.isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.sanitize = (str) => {
  if (!str) return "";
  return str.replace(/[<>"'&]/g, "");
};

exports.generateSlug = async (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
};
