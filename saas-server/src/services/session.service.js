const Session = require('../models/session.model');
const crypto = require('crypto');
const { ApiError } = require('../utils/api-error');

class SessionService {
  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateOTP(length = 6) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString().padStart(length, '0');
  }

  static async createLoginSession(userId, email) {
    const token = this.generateToken();
    return Session.createSession({
      userId,
      type: 'login',
      token,
      email,
      expiresIn: 24 * 3600, // 24 hours
      metadata: { lastLogin: new Date() }
    });
  }

  static async createRegistrationOTP(email) {
    const otp = this.generateOTP();
    return Session.createSession({
      type: 'registration_session',
      token: otp,
      email: email,
      expiresIn: 900 // 15 minutes
    });
  }

  static async createPasswordResetOTP(userId, email) {
    const otp = this.generateOTP();
    return Session.createSession({
      userId,
      type: 'password_reset_session',
      token: otp,
      expiresIn: 900 // 15 minutes
    });
  }

  static async createEmailVerificationOTP(userId, email) {
    const otp = this.generateOTP();
    return Session.createSession({
      userId,
      type: 'registration_session',
      token: otp,
      expiresIn: 900 // 15 minutes
    });
  }

  static async validateSession(token, type, email) {
    const session = await Session.findValidSession(token, type);
    
    if (!session) {
      throw new ApiError(400, 'Invalid or expired session');
    }
    
    if (session.expiresAt < new Date()) {
      throw new ApiError(400, 'Session expired');
    }

    if (email && session.email !== email) {
      await session.incrementAttempts();
      throw new ApiError(401, 'Invalid session');
    }

    // Remove this counter increment for successful validation
    // Only increment attempts on failed validation
    
    if (session.attempts >= session.maxAttempts) {
      await session.invalidate();
      throw new ApiError(429, 'Maximum attempts reached - session locked');
    }

    return session;
  }

  static async invalidateSession(token, type) {
    const session = await Session.findOne({ token, type });
    if (session) {
      await session.invalidate();
    }
  }

  static async invalidateUserSessions(userId, type) {
    await Session.invalidateUserSessions(userId, type);
  }

  static async cleanupExpiredSessions() {
    const now = new Date();
    await Session.deleteMany({
      $or: [
        { expiresAt: { $lt: now } },
        { isValid: false }
      ]
    });
  }
}

module.exports = SessionService;