const OTP = require('../models/otp.model');
const { ApiError } = require('../utils/api-error');

class OTPService {
  static async createRegistrationOTP(email) {
    return this._createOTP(email, 'registration');
  }

  static async createPasswordResetOTP(email) {
    return this._createOTP(email, 'password_reset');
  }

  static async _createOTP(email, type) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000); // 15 minutes

    const sessionId = require('crypto').randomUUID();
    return OTP.findOneAndUpdate(
      { email, type },
      { 
        otp,
        sessionId,
        expiresAt,
        attempts: 0,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, new: true }
    );
  }

  static async validateOTP(email, otp, type) {
    const record = await OTP.findOne({ email, type });
    
    if (!record || record.otp !== otp) {
      throw new ApiError(401, 'Invalid OTP');
    }

    if (record.expiresAt < new Date()) {
      throw new ApiError(400, 'OTP expired');
    }

    if (record.attempts >= 3) {
      await OTP.deleteOne({ _id: record._id });
      throw new ApiError(429, 'Maximum attempts reached');
    }

    await OTP.deleteOne({ _id: record._id });
    return true;
  }
}

module.exports = OTPService;