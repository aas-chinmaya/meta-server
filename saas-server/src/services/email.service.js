const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const config = require('../config');
const { logger } = require('../utils/logger');
const { ApiError } = require('../utils/api-error');
const Handlebars = require('handlebars');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass
      }
    });
  }

  async sendOTP(email, otp, type, sessionId) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails/otp-template.html');
      const templateContent = await fs.promises.readFile(templatePath, 'utf8');
      const html = Handlebars.compile(templateContent)({
        type: type.replace(/_/g, ' '),
        otp,
        sessionId,
        expirationMinutes: 10
      });
      const subject = this.getOTPSubject(type);

      await this.transporter.sendMail({
        from: config.email.auth.user,
        to: email,
        subject,
        html
      });

      logger.info('OTP email sent successfully', {
        email,
        type
      });
    } catch (error) {
      logger.error('Error sending OTP email', {
        error: error.message,
        stack: error.stack
      });
      throw ApiError.internal('Failed to send OTP email');
    }
  }

  async sendConfirmation({ email, name, templateType, additionalData = {} }) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails/confirmation-template.html');
      const templateContent = await fs.promises.readFile(templatePath, 'utf8');
      
      const templateVars = {
        title: 'Action Confirmation',
        header: 'Success!',
        message: 'Your action has been completed successfully.',
        showLoginPrompt: false,
        loginUrl: `${config.clientUrl}/login`,
        ...additionalData
      };

      switch(templateType) {
        case 'registration-success':
          templateVars.title = 'Registration Complete';
          templateVars.header = 'Welcome Aboard!';
          templateVars.message = `Hi ${name}, your account has been successfully created.`;
          templateVars.showLoginPrompt = true;
          break;
        case 'password-reset-success':
          templateVars.title = 'Password Updated';
          templateVars.header = 'Password Changed';
          templateVars.message = `Hi ${name}, your password has been successfully updated.`;
          break;
        case 'tenant-registration-success':
          templateVars.title = 'Tenant Registration Complete';
          templateVars.header = 'Organization Registered!';
          templateVars.message = `Hi ${name}, your tenant registration was successful.`;
          break;
      }

      const html = Handlebars.compile(templateContent)(templateVars);

      await this.transporter.sendMail({
        from: config.email.auth.user,
        to: email,
        subject: templateVars.title,
        html
      });

      logger.info('Confirmation email sent', { email, templateType });
    } catch (error) {
      logger.error('Confirmation email failed', { error: error.message });
      throw ApiError.internal('Failed to send confirmation email');
    }
  }


  getOTPSubject(type) {
    const subjects = {
      login: 'Your Login Verification Code',
      registration: 'Account Registration Code',
      password_reset: 'Password Reset Verification',
      email_verification: 'Email Verification Code'
    };
    return subjects[type] || 'OTP Verification';
  }

  getOTPTemplate(otp, type) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>OTP Verification</h2>
        <p>Your ${type} OTP is: <strong>${otp}</strong></p>
        <p>This OTP will expire in ${config.otp.expiresIn} minutes.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
      </div>
    `;
  }

  async sendWelcomeEmail(email, name, requestId) {
    try {
      await this.transporter.sendMail({
        from: config.email.auth.user,
        to: email,
        subject: 'Welcome to Our Platform',
        html: this.getWelcomeTemplate(name)
      });

      logger.info('Welcome email sent successfully', {
        requestId,
        email
      });
    } catch (error) {
      logger.error('Error sending welcome email', {
        requestId,
        error: error.message
      });
      // Don't throw error for welcome email as it's not critical
    }
  }

  getWelcomeTemplate(name) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Our Platform</h2>
        <p>Dear ${name},</p>
        <p>Thank you for joining our platform. We're excited to have you on board!</p>
        <p>If you have any questions, feel free to contact our support team.</p>
      </div>
    `;
  }
}

module.exports = EmailService;