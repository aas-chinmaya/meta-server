const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authController = require('../controllers/auth.controller');
const { validateLogin, validateRegister, validateOTP, validateResetPassword } = require('../validators/auth.validator');
const { verifyToken } = require('../middlewares/auth.middleware');
const { verifyRefreshToken } = require('../middlewares/refresh-token.middleware');
const User = require('../models/user.model');
const Tenant = require('../models/tenant.model');
const RefreshToken = require('../models/refresh-token.model');
const SessionService = require('../services/session.service');
const EmailService = require('../services/email.service');
const config = require('../config');
const { ApiError } = require('../utils/api-error');

const emailService = new EmailService();

// Register new user
router.post('/register', validateRegister, authController.register);

// Resend OTP
router.post('/resend-otp', authController.resendOTP);

// Verify OTP and complete registration
router.post('/verify-otp', validateOTP, authController.verifyOtp);

// Login
router.post('/login', validateLogin, authController.login);

// Refresh token
router.post('/refresh-token', verifyRefreshToken, authController.handleRefreshToken);

// Logout
router.post('/logout', verifyToken, authController.logout);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password', authController.resetPassword);

module.exports = router;