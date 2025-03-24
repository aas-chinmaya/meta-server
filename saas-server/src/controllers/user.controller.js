const User = require('../models/user.model');
const { ApiError } = require('../utils/api-error');

const userController = {
  async getAllUsers(req, res, next) {
    try {
      const users = await User.find().select('-password');
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req, res, next) {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) throw new ApiError(404, 'User not found');
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async createUser(req, res, next) {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) throw new ApiError(400, 'User already exists');

      const newUser = new User({ email, password, firstName, lastName, role });
      await newUser.save();

      res.status(201).json({
        success: true,
        data: {
          userId: newUser.userId,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req, res, next) {
    try {
      const user = await User.findOneAndUpdate(
        { userId: req.params.userId },
        req.body,
        { new: true, runValidators: true }
      ).select('-password');

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
  },

  async deleteUser(req, res, next) {
    try {
      const user = await User.findOneAndDelete({ userId: req.params.userId });
      
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;