exports.errorHandler = (err, req, res, next) => {
  const error = typeof err === 'string' ? { message: err, statusCode: 400 } : err;
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

exports.notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
