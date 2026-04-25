const Joi = require('joi');

exports.createRecallSchema = Joi.object({
  patientId: Joi.number().required(),
  reason: Joi.string().required(),
  dueDate: Joi.date().required(),
});

exports.updateRecallSchema = Joi.object({
  reason: Joi.string().optional(),
  dueDate: Joi.date().optional(),
  status: Joi.string().valid('pending', 'completed', 'missed').optional(),
});