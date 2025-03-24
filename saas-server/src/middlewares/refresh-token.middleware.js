const jwt = require('jsonwebtoken');
const config = require('../config');
const Session = require('../models/session.model');
const { ApiError } = require('../utils/api-error');

const verifyRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.headers['x-refresh-token'];

    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    
    // Check if refresh token exists in session and is valid
    const session = await Session.findValidSession(refreshToken, 'refresh_token');
    
    if (!session) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: session.sessionId
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(ApiError.unauthorized('Invalid refresh token'));
    }
    next(error);
  }
};

module.exports = { verifyRefreshToken };