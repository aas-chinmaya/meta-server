const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { ApiError } = require('../utils/api-error');
const { authMiddleware } = require('../middlewares/auth.middleware');
const UserController = require('../controllers/user.controller');

// Get all users (Admin only)
router.get('/', authMiddleware(['super_admin', 'admin']), async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:userId', authMiddleware(['super_admin', 'admin']), async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.userId }).select('-password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/:userId', authMiddleware(['super_admin', 'admin']), UserController.updateUser);

// Delete user
router.delete('/:userId', authMiddleware(['super_admin']), UserController.deleteUser);

module.exports = router;