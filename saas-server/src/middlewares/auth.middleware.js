const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/api-error');
const config = require('../config');
const User = require('../models/user.model');
const Tenant = require('../models/tenant.model');
const Role = require('../models/role.model');
const Permission = require('../models/permission.model');

const authMiddleware = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

      if (!token) {
        throw ApiError.unauthorized('Authentication token is required');
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      
      if (!allowedRoles.includes(decoded.role)) {
        throw ApiError.forbidden('You do not have permission to access this resource');
      }

      // Check if user exists and is active
      const user = decoded.role === 'tenant' ?
        await Tenant.findOne({ tenantId: decoded.userId, isActive: true }) :
        await User.findOne({ userId: decoded.userId, isActive: true });

      if (!user) {
        throw ApiError.unauthorized('User not found or inactive');
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized('Authentication token is required');
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Check if user exists and is active
    const user = decoded.role === 'tenant' ?
      await Tenant.findOne({ tenantId: decoded.userId, isActive: true }) :
      await User.findOne({ userId: decoded.userId, isActive: true });

    if (!user) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    // Get user's role and permissions
    let permissions = [];
    if (decoded.role !== 'tenant') {
      const role = await Role.findOne({ name: decoded.role, isActive: true });
      if (role) {
        const permissionDocs = await Permission.find({
          permissionId: { $in: role.permissions },
          isActive: true
        });
        permissions = permissionDocs.map(p => `${p.resource}:${p.action}`);
      }
    }

    req.user = {
      userId: user.userId || user.tenantId,
      email: user.email,
      role: decoded.role,
      permissions
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(ApiError.unauthorized('Invalid token'));
    }
    next(error);
  }
};

// Check role authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Access denied: insufficient role permissions'));
    }
    next();
  };
};

// Check permission authorization
const hasPermission = (requiredPermission) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    
    if (!userPermissions.includes(requiredPermission)) {
      return next(ApiError.forbidden('Access denied: insufficient permissions'));
    }
    next();
  };
};

// Verify session
const verifySession = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return next(ApiError.unauthorized('Session expired or invalid'));
  }
  next();
};

module.exports = {
  authMiddleware,
  verifyToken,
  authorize,
  hasPermission,
  verifySession
};