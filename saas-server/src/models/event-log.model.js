const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const eventLogSchema = new mongoose.Schema({
  eventId: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true
  },
  userId: {
    type: String,
    ref: 'User',
    required: false // Not required for system events
  },
  type: {
    type: String,
    required: true,
    enum: [
      'auth_success',
      'auth_failure',
      'user_created',
      'user_updated',
      'user_deleted',
      'role_created',
      'role_updated',
      'role_deleted',
      'permission_created',
      'permission_updated',
      'permission_deleted',
      'session_created',
      'session_expired',
      'session_invalidated',
      'system_error',
      'system_warning',
      'system_info'
    ]
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning', 'info'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // Automatically delete logs after 30 days
  }
});

// Indexes for faster queries
eventLogSchema.index({ type: 1, createdAt: -1 });
eventLogSchema.index({ userId: 1, createdAt: -1 });
eventLogSchema.index({ status: 1 });
eventLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Static methods
eventLogSchema.statics.logEvent = async function({
  userId,
  type,
  action,
  resource,
  status,
  message,
  metadata = {},
  ipAddress,
  userAgent
}) {
  return this.create({
    userId,
    type,
    action,
    resource,
    status,
    message,
    metadata,
    ipAddress,
    userAgent
  });
};

eventLogSchema.statics.findEventsByUser = async function(userId, options = {}) {
  const { limit = 50, skip = 0, type, status, startDate, endDate } = options;
  
  const query = { userId };
  if (type) query.type = type;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const EventLog = mongoose.model('EventLog', eventLogSchema);

module.exports = EventLog;