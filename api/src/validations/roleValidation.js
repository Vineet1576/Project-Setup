const Joi = require("joi");

const validate = (schema, data) => {
  const { error } = schema.validate(data, {
    abortEarly: false,
    allowUnknown: true,
  });
  if (error) {
    const message = error.details.map((d) => d.message).join(", ");
    return { success: false, message };
  }
  return { success: true };
};

const RoleValidations = {};

RoleValidations.createRole = async (req) => {
  const schema = Joi.object({
    name: Joi.string().trim().required(),
    displayName: Joi.string().trim().required(),
    description: Joi.string().optional().allow(""),
    permissions: Joi.array().items(Joi.string()).optional(),
  });
  return validate(schema, req.body);
};

RoleValidations.updateRole = async (req) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().trim().optional(),
    displayName: Joi.string().trim().optional(),
    description: Joi.string().optional().allow(""),
    permissions: Joi.array().items(Joi.string()).optional(),
  });
  return validate(schema, req.body);
};

RoleValidations.changeStatus = async (req) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    status: Joi.string().valid("active", "inactive").required(),
  });
  return validate(schema, req.body);
};

RoleValidations.deleteRole = async (req) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return validate(schema, req.body);
};

module.exports = RoleValidations;
