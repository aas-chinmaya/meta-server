const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const permissionSchema = new mongoose.Schema({
  permissionId: {
    type: String,
    default: () => nanoid(10),
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'manage'],
    required: true
  },
  createdBy: {
    type: String,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
permissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;