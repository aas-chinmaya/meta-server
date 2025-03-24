const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const roleSchema = new mongoose.Schema({
  roleId: {
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
  permissions: [{
    type: String,
    ref: 'Permission',
    required: true
  }],
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
roleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;