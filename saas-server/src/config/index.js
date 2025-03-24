const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  mongodb: {
    uri: process.env.MONGODB_URI || undefined
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN
  },
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: parseInt(process.env.SESSION_EXPIRES_IN) * 60 * 60 * 1000 // Convert hours to milliseconds
  },
  otp: {
    expiresIn: parseInt(process.env.OTP_EXPIRES_IN) // Minutes
  },
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  rateLimit: {
    window: parseInt(process.env.RATE_LIMIT_WINDOW),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  },
  corsOrigins: process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',') : 
    ['http://localhost:3000']
};

module.exports = config;