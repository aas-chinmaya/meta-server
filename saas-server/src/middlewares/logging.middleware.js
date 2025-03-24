const { nanoid } = require('nanoid');
const { logger } = require('../utils/logger');

const logRequest = (req, res, next) => {
  // Generate unique request ID
  req.requestId = nanoid(10);

  // Log request details
  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });

  // Log response
  const originalSend = res.send;
  res.send = function (body) {
    logger.info('Outgoing response', {
      requestId: req.requestId,
      statusCode: res.statusCode
    });
    return originalSend.call(this, body);
  };

  next();
};

module.exports = { logRequest };