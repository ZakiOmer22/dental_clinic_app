const Joi = require('joi');

const createPatientSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'First name is required',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().allow('', null),
  mobile: Joi.string().allow('', null),
  dateOfBirth: Joi.date().allow(null),
  gender: Joi.string().valid('Male', 'Female', 'Other', '').allow('', null),
  address: Joi.string().allow('', null),
  city: Joi.string().allow('', null),
  state: Joi.string().allow('', null),
  zipCode: Joi.string().allow('', null),
  emergencyContactName: Joi.string().allow('', null),
  emergencyContactPhone: Joi.string().allow('', null),
  medicalHistory: Joi.string().allow('', null),
  allergies: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
  insuranceProvider: Joi.string().allow('', null),
  insurancePolicyNumber: Joi.string().allow('', null),
});

const updatePatientSchema = Joi.object({
  firstName: Joi.string().min(1).max(100),
  lastName: Joi.string().min(1).max(100),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().allow('', null),
  mobile: Joi.string().allow('', null),
  dateOfBirth: Joi.date().allow(null),
  gender: Joi.string().valid('Male', 'Female', 'Other', '').allow('', null),
  address: Joi.string().allow('', null),
  city: Joi.string().allow('', null),
  state: Joi.string().allow('', null),
  zipCode: Joi.string().allow('', null),
  emergencyContactName: Joi.string().allow('', null),
  emergencyContactPhone: Joi.string().allow('', null),
  medicalHistory: Joi.string().allow('', null),
  allergies: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
  insuranceProvider: Joi.string().allow('', null),
  insurancePolicyNumber: Joi.string().allow('', null),
  isActive: Joi.boolean(),
}).min(1);

const patientQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow('', null),
  isActive: Joi.boolean(),
  sortBy: Joi.string().valid('firstName', 'lastName', 'createdAt', 'updatedAt').default('createdAt'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

module.exports = {
  createPatientSchema,
  updatePatientSchema,
  patientQuerySchema,
};