const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const tenantController = require('../controllers/tenant.controller');

// Create tenant (Super Admin only)
router.post('/', authMiddleware(['super_admin']), tenantController.createTenant);

// Get all tenants
router.get('/', authMiddleware(['super_admin', 'admin']), tenantController.getAllTenants);

// Get tenant by ID
router.get('/:tenantId', authMiddleware(['super_admin', 'admin']), tenantController.getTenantById);

// Update tenant
router.put('/:tenantId', authMiddleware(['super_admin']), tenantController.updateTenant);

// Delete tenant
router.delete('/:tenantId', authMiddleware(['super_admin']), tenantController.deleteTenant);

module.exports = router;