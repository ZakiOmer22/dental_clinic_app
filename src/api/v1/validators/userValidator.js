const Joi = require('joi');

exports.createUserSchema = Joi.object({
  fullName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'dentist', 'receptionist', 'assistant').required(),
});

exports.updateUserSchema = Joi.object({
  fullName: Joi.string().optional(),
  role: Joi.string().optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
});