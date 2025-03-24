const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    default: uuidv4,
    required: true
  },
  userId: {
    type: String,
    ref: 'User',
    required: false // Not required for pre-registration OTPs
  },
  type: {
    type: String,
    enum: ['login', 'registration_session', 'password_reset_session'],
    required: true
  },
  token: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  isValid: {
    type: Boolean,
    default: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
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
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

// Index for faster queries and automatic cleanup
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1, type: 1 });
sessionSchema.index({ email: 1, type: 1 });
// add this compound unique index for better control
sessionSchema.index({ token: 1, type: 1 }, { unique: true, name: 'token_type_unique' });

// Instance methods
sessionSchema.methods.invalidate = async function() {
  await Session.findOneAndUpdate(
    { _id: this._id },
    { $set: { isValid: false } },
    { new: true }
  );
};

sessionSchema.methods.incrementAttempts = async function() {
  this.attempts += 1;
  this.lastUsedAt = new Date();
  if (this.attempts >= this.maxAttempts) {
    this.isValid = false;
  }
  return this.save();
};

// Static methods
sessionSchema.statics.createSession = async function({
  userId,
  type,
  token,
  email,
  expiresIn = 3600, // Default 1 hour
  maxAttempts = 3,
  metadata = {}
}) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  
  return this.create({
    userId,
    type,
    token,
    email,
    expiresAt,
    maxAttempts,
    metadata
  });
};

sessionSchema.statics.findValidSession = async function(token, type) {
  return this.findOne({
    token,
    type,
    isValid: true,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: this.maxAttempts }
  });
};

sessionSchema.statics.invalidateUserSessions = async function(userId, type) {
  return this.updateMany(
    { userId, type, isValid: true },
    { $set: { isValid: false } }
  );
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;