const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Create permission (Super Admin only)
router.post('/', authMiddleware(['super_admin']), permissionController.createPermission);

// Get all permissions
router.get('/', authMiddleware(['super_admin', 'admin']), permissionController.getPermissions);

// Get permission by ID
router.get('/:permissionId', authMiddleware(['super_admin', 'admin']), permissionController.getPermissionById);

// Update permission
router.put('/:permissionId', authMiddleware(['super_admin']), permissionController.updatePermission);

// Delete permission
router.delete('/:permissionId', authMiddleware(['super_admin']), permissionController.deletePermission);

module.exports = router;