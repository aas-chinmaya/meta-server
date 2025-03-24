const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  })
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('super_admin', 'admin').required(),
  businessName: Joi.string().when('role', {
    is: 'tenant',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  businessDetails: Joi.string().when('role', {
    is: 'tenant',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  })
});

const otpVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required().messages({
    'string.length': 'OTP must be 6 characters long',
    'any.required': 'OTP is required'
  }),
  type: Joi.string().valid('login', 'registration_session', 'password_reset_session').required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  newPassword: Joi.string().min(8).required(),
  otp: Joi.string().length(6).required()
});

const tenantApplicationSchema = Joi.object({
  tempId: Joi.string().required(),
  businessName: Joi.string().required(),
  businessDetails: Joi.string().required()
});

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateOTP = (req, res, next) => {
  const { error } = otpVerificationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

const validateResetPassword = (req, res, next) => {
  const { error } = resetPasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateLogin,
  validateRegister,
  validateOTP,
  validateResetPassword,
  loginSchema,
  registerSchema,
  otpVerificationSchema,
  resetPasswordSchema,
  tenantApplicationSchema
};