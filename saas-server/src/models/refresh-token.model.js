const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const refreshTokenSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries and automatic cleanup
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1 });


// Instance methods
refreshTokenSchema.methods.revoke = async function() {
  this.isRevoked = true;
  return this.save();
};

// Static methods
refreshTokenSchema.statics.createToken = async function(userId, token, expiresIn = 7 * 24 * 3600) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  return this.create({
    userId,
    token,
    expiresAt
  });
};

refreshTokenSchema.statics.findValidToken = async function(token) {
  return this.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });
};

refreshTokenSchema.statics.revokeUserTokens = async function(userId) {
  return this.updateMany(
    { userId, isRevoked: false },
    { $set: { isRevoked: true } }
  );
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;