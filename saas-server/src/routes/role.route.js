const express = require('express');
const router = express.Router();
const Role = require('../models/role.model');
const { ApiError } = require('../utils/api-error');
const { authMiddleware } = require('../middlewares/auth.middleware');
const roleController = require('../controllers/role.controller');

// Create role (Super Admin only)
router.post('/', authMiddleware(['super_admin']), roleController.createRole);

// Get all roles
router.get('/', authMiddleware(['super_admin', 'admin']), roleController.getAllRoles);

// Get role by ID
router.get('/:roleId', authMiddleware(['super_admin', 'admin']), roleController.getRoleById);

// Update role
router.put('/:roleId', authMiddleware(['super_admin']), roleController.updateRole);

// Delete role
router.delete('/:roleId', authMiddleware(['super_admin']), roleController.deleteRole);

module.exports = router;