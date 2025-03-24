const Permission = require('../models/permission.model');
const { ApiError } = require('../utils/api-error');

const permissionController = {
  createPermission: async (req, res, next) => {
    try {
      const { name, description, resource, action } = req.body;

      const permission = new Permission({
        name,
        description,
        resource,
        action,
        createdBy: req.user.userId
      });

      await permission.save();

      res.status(201).json({
        success: true,
        data: permission
      });
    } catch (error) {
      next(error);
    }
  },

  getPermissions: async (req, res, next) => {
    try {
      const permissions = await Permission.find();
      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      next(error);
    }
  },

  getPermissionById: async (req, res, next) => {
    try {
      const permission = await Permission.findOne({ permissionId: req.params.permissionId });
      if (!permission) {
        throw new ApiError(404, 'Permission not found');
      }
      res.json({
        success: true,
        data: permission
      });
    } catch (error) {
      next(error);
    }
  },

  updatePermission: async (req, res, next) => {
    try {
      const { name, description, resource, action } = req.body;
      const permission = await Permission.findOne({ permissionId: req.params.permissionId });

      if (!permission) {
        throw new ApiError(404, 'Permission not found');
      }

      if (name) permission.name = name;
      if (description) permission.description = description;
      if (resource) permission.resource = resource;
      if (action) permission.action = action;

      await permission.save();

      res.json({
        success: true,
        data: permission
      });
    } catch (error) {
      next(error);
    }
  },

  deletePermission: async (req, res, next) => {
    try {
      const permission = await Permission.findOne({ permissionId: req.params.permissionId });
      if (!permission) {
        throw new ApiError(404, 'Permission not found');
      }

      await permission.deleteOne();

      res.json({
        success: true,
        message: 'Permission deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = permissionController;