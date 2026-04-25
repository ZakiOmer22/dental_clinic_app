const Joi = require('joi');

exports.createInsuranceSchema = Joi.object({
  patientId: Joi.number().required(),
  providerId: Joi.number().required(),
  policyNumber: Joi.string().required(),
  coverageLimit: Joi.number().required(),
  expiryDate: Joi.date().required(),
});

exports.updateInsuranceSchema = Joi.object({
  coverageLimit: Joi.number().optional(),
  expiryDate: Joi.date().optional(),
  status: Joi.string().valid('active', 'expired', 'suspended').optional(),
});