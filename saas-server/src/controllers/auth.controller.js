const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Tenant = require('../models/tenant.model');
const RefreshToken = require('../models/refresh-token.model');
const SessionService = require('../services/session.service');
const OTPService = require('../services/otp.service');
const OTP = require('../models/otp.model');
const EmailService = require('../services/email.service');
const config = require('../config');
const { ApiError } = require('../utils/api-error');

const { logger } = require('../utils/logger');
const emailService = new EmailService();

const authController = {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) throw new ApiError(400, 'User already exists');

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ApiError(400, 'Invalid email format');
      }

      let session;
      try {
        const normalizedEmail = email.toLowerCase();
        session = await OTPService.createRegistrationOTP(normalizedEmail);
        await emailService.sendOTP(email, session.otp, 'registration', session.sessionId);
      } catch (error) {
        logger.error('Failed to send registration OTP', {
          email,
          error: error.message,
          stack: error.stack
        });
        throw new ApiError(500, 'Failed to send OTP. Please try again later.');
      }

res.status(200).json({
        success: true,
        message: 'Registration OTP sent successfully',
        data: { email, sessionId: session.sessionId }
      });
    } catch (error) {
      next(error);
    }
  },

  async verifyOtp(req, res, next) {
    try {
      let { email, otp, type } = req.body;
      email = email.toLowerCase();
      const { sessionId } = req.body;
      const session = await OTPService.validateOTP(email, otp, 'registration');

      

      if (type === 'registration') {
        const { firstName, lastName, role, password } = req.body;
        const user = new User({ email, password, firstName, lastName, role, emailVerified: true });
        await user.save();

        await emailService.sendConfirmation({
          email,
          name: `${firstName} ${lastName}`,
          templateType: 'registration-success'
        });

        const accessToken = jwt.sign(
          { userId: user.userId, role: user.role },
          config.jwt.secret,
          { expiresIn: config.jwt.expiresIn }
        );

        const refreshToken = jwt.sign(
          { userId: user.userId, email: user.email, role: user.role },
          config.jwt.refreshSecret,
          { expiresIn: config.jwt.refreshExpiresIn }
        );

        await RefreshToken.createToken(user.userId, refreshToken);

        res.cookie('token', accessToken, { httpOnly: true, secure: true });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });

        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          data: { user: { userId: user.userId, email: user.email, role: user.role }, tokens: { accessToken, refreshToken } }
        });
      } else {
        const tenant = new Tenant(req.body);
        await tenant.save();

        await emailService.sendConfirmation({
          email,
          name: tenant.companyName,
          templateType: 'tenant-registration-success'
        });

        res.status(200).json({ success: true, message: 'OTP verified successfully', data: tenant });
      }

      await session.invalidate();
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }) || await Tenant.findOne({ email });
      if (!user) throw new ApiError(401, 'Invalid credentials');

      const isValid = await user.comparePassword(password);
      if (!isValid) throw new ApiError(401, 'Invalid credentials');

      const accessToken = jwt.sign(
        { userId: user.userId || user.tenantId, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const refreshToken = jwt.sign(
        { userId: user.userId || user.tenantId, email: user.email, role: user.role },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      await RefreshToken.createToken(user.userId || user.tenantId, refreshToken);
      user.lastLogin = new Date();
      await user.save();

      res.cookie('token', accessToken, { httpOnly: true, secure: true });
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });

      res.json({
        success: true,
        data: { user: { userId: user.userId || user.tenantId, email: user.email, role: user.role }, tokens: { accessToken, refreshToken } }
      });
    } catch (error) {
      next(error);
    }
  },

  async resendOTP(req, res, next) {
    try {
      const { email } = req.body;
      const session = await SessionService.createRegistrationOTP(email);
      await emailService.sendOTP(email, session.token, 'registration', session.sessionId);

      res.status(200).json({
        success: true,
        message: 'OTP resent successfully',
        data: { email }
      });
    } catch (error) {
      next(error);
    }
  },

  async handleRefreshToken(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const storedToken = await RefreshToken.validateToken(payload.userId, refreshToken);

      const newAccessToken = jwt.sign(
        { userId: payload.userId, role: payload.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.cookie('token', newAccessToken, { httpOnly: true, secure: true });
      res.json({
        success: true,
        data: { accessToken: newAccessToken }
      });
    } catch (error) {
      next(new ApiError(401, 'Invalid refresh token'));
    }
  },

  async logout(req, res, next) {
    try {
      const { userId } = req;
      await RefreshToken.deleteMany({ userId });
      res.clearCookie('token');
      res.clearCookie('refreshToken');
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email }) || await Tenant.findOne({ email });
      if (!user) throw new ApiError(404, 'User not found');

      const otpRecord = await OTPService.createPasswordResetOTP(email);
      await emailService.sendOTP(email, otpRecord.otp, 'passwordReset', otpRecord.sessionId);

      res.json({
        success: true,
        message: 'Password reset OTP sent',
        data: { email }
      });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;
      await OTPService.validateOTP(email, otp, 'passwordReset');

      const user = await User.findOne({ email }) || await Tenant.findOne({ email });
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;