const crypto = require("crypto");
const mongoose = require("mongoose");

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

exports.trimAndLowercase = (str) => {
  if (!str) return "";
  return str.toString().trim().toLowerCase();
};

exports.createAppError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
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

exports.isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

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
