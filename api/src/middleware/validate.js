const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      return res.status(400).json({
        success: false,
        error: { code: 400, message: messages },
      });
    }
    next();
  };
};

module.exports = validate;
