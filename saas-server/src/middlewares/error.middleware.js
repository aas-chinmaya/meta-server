const { logger } = require('../utils/logger');
const { ApiError } = require('../utils/api-error');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error:', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack
  });

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      requestId: req.requestId,
      errors: err.errors
    });
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      requestId: req.requestId,
      errors: Object.values(err.errors).map(error => error.message)
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      requestId: req.requestId
    });
  }

  // Handle expired JWT
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      requestId: req.requestId
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    requestId: req.requestId
  });
};

module.exports = { errorHandler };