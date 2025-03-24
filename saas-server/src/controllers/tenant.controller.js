const Tenant = require('../models/tenant.model');
const { ApiError } = require('../utils/api-error');

const tenantController = {
  async getAllTenants(req, res, next) {
    try {
      const tenants = await Tenant.find().select('-password');
      res.json({ success: true, data: tenants });
    } catch (error) {
      next(error);
    }
  },

  async getTenantById(req, res, next) {
    try {
      const tenant = await Tenant.findById(req.params.tenantId).select('-password');
      if (!tenant) throw new ApiError(404, 'Tenant not found');
      res.json({ success: true, data: tenant });
    } catch (error) {
      next(error);
    }
  },

  async createTenant(req, res, next) {
    try {
      const { email, password, companyName, contactPerson } = req.body;
      const existingTenant = await Tenant.findOne({ email });
      if (existingTenant) throw new ApiError(400, 'Tenant already exists');

      const newTenant = new Tenant({ email, password, companyName, contactPerson });
      await newTenant.save();

      res.status(201).json({
        success: true,
        data: {
          tenantId: newTenant.tenantId,
          email: newTenant.email,
          companyName: newTenant.companyName
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateTenant(req, res, next) {
    try {
      const updatedTenant = await Tenant.findByIdAndUpdate(
        req.params.tenantId,
        req.body,
        { new: true }
      ).select('-password');
      if (!updatedTenant) throw new ApiError(404, 'Tenant not found');
      res.json({ success: true, data: updatedTenant });
    } catch (error) {
      next(error);
    }
  },

  async deleteTenant(req, res, next) {
    try {
      const tenant = await Tenant.findByIdAndDelete(req.params.tenantId);
      if (!tenant) throw new ApiError(404, 'Tenant not found');
      res.json({ success: true, message: 'Tenant deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = tenantController;