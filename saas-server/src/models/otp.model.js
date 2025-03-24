const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['registration', 'password_reset', 'email_verification'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster querying by email and type
otpSchema.index({ email: 1, type: 1 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;