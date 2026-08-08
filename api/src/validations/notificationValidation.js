const Joi = require("joi");

const validate = (schema, data) => {
  const { error } = schema.validate(data, { abortEarly: false, allowUnknown: false });
  if (error) {
    const message = error.details.map((d) => d.message).join(", ");
    return { success: false, message };
  }
  return { success: true };
};

exports.list = async (req) =>
  validate(
    Joi.object({
      page: Joi.number().min(1).optional(),
      count: Joi.number().min(1).max(100).optional(),
      type: Joi.string()
        .valid("subscription_reminder", "subscription_expired", "payment_success", "payment_failed", "new_message", "account_approved", "admin_broadcast", "system")
        .optional(),
      read: Joi.boolean().optional(),
      search: Joi.string().allow("").optional(),
      excludeType: Joi.string().optional(),
    }),
    req.decryptedParams || req.query,
  );

exports.markRead = async (req) =>
  validate(
    Joi.object({
      id: Joi.string().required(),
    }),
    req.body,
  );

exports.markDismiss = async (req) =>
  validate(
    Joi.object({
      id: Joi.string().required(),
    }),
    req.body,
  );

exports.markAllRead = async (req) =>
  validate(
    Joi.object({
      type: Joi.string().optional(),
    }),
    req.body,
  );
