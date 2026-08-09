const Joi = require('joi');

const validate = (schema, data) => {
  const { error } = schema.validate(data, { abortEarly: false, allowUnknown: true });
  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return { success: false, message };
  }
  return { success: true };
};

const UserValidations = {};

UserValidations.register = async (req) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(2).max(50).optional().allow(''),
    lastName: Joi.string().trim().max(50).optional().allow(''),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    mobileno: Joi.string().optional().allow(''),
    dob: Joi.string().optional().allow(''),
    role: Joi.string().optional(),
  });
  return validate(schema, req.body);
};

UserValidations.adminLogin = async (req) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  return validate(schema, req.body);
};

UserValidations.userLogin = async (req) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    device_token: Joi.string().optional().allow(''),
    currentLocation: Joi.object().optional(),
  });
  return validate(schema, req.body);
};

UserValidations.userProfile = async (req) => {
  const schema = Joi.object({
    id: Joi.string().optional(),
  });
  const data = req.decryptedParams || req.query;
  return validate(schema, data);
};

UserValidations.updateProfile = async (req) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(2).max(50).optional().allow(''),
    lastName: Joi.string().trim().max(50).optional().allow(''),
    mobileno: Joi.string().optional().allow('').min(5).max(50),
    image: Joi.string().optional().allow(''),
    address: Joi.string().optional().allow(''),
    city: Joi.string().optional().allow(''),
    state: Joi.string().optional().allow(''),
    country: Joi.string().optional().allow(''),
    pinCode: Joi.string().optional().allow(''),
    bio: Joi.string().optional().allow(''),
    dob: Joi.string().optional().allow(''),
    gender: Joi.string().optional(),
  });
  return validate(schema, req.body);
};

UserValidations.changePassword = async (req) => {
  const schema = Joi.object({
    newPassword: Joi.string().min(8).max(128).required(),
    currentPassword: Joi.string().required(),
    id: Joi.string().optional(),
  });
  return validate(schema, req.body);
};

UserValidations.forgotPassword = async (req) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  return validate(schema, req.body);
};

UserValidations.addUser = async (req) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(2).max(50).optional().allow(''),
    lastName: Joi.string().trim().max(50).optional().allow(''),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).optional(),
    role: Joi.string().optional(),
    mobileno: Joi.string().optional().allow(''),
    address: Joi.string().optional().allow(''),
    city: Joi.string().optional().allow(''),
    state: Joi.string().optional().allow(''),
    country: Joi.string().optional().allow(''),
  });
  return validate(schema, req.body);
};

UserValidations.update_password = async (req) => {
  const schema = Joi.object({
    newPassword: Joi.string().min(8).max(128).required(),
  });
  return validate(schema, req.body);
};

UserValidations.resentOtp = async (req) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  return validate(schema, req.body);
};

module.exports = UserValidations;
