const Role = require('../models/role.model');
const { ApiError } = require('../utils/api-error');

const roleController = {
  async getAllRoles(req, res, next) {
    try {
      const roles = await Role.find();
      res.json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  },

  async getRoleById(req, res, next) {
    try {
      const role = await Role.findById(req.params.id);
      if (!role) throw new ApiError(404, 'Role not found');
      res.json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  },

  async createRole(req, res, next) {
    try {
      const { name, permissions } = req.body;
      const existingRole = await Role.findOne({ name });
      if (existingRole) throw new ApiError(400, 'Role already exists');

      const newRole = new Role({ name, permissions });
      await newRole.save();

      res.status(201).json({
        success: true,
        data: {
          roleId: newRole.roleId,
          name: newRole.name
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateRole(req, res, next) {
    try {
      const role = await Role.findByIdAndUpdate(req.params.roleId, req.body, { 
        new: true,
        runValidators: true
      });
      if (!role) throw new ApiError(404, 'Role not found');
      res.json({ success: true, data: role });
      if (!updatedRole) throw new ApiError(404, 'Role not found');
      res.json({ success: true, data: updatedRole });
    } catch (error) {
      next(error);
    }
  },

  async deleteRole(req, res, next) {
    try {
      const role = await Role.findByIdAndDelete(req.params.id);
      if (!role) throw new ApiError(404, 'Role not found');
      res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = roleController;