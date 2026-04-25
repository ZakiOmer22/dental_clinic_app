const Joi = require('joi');

exports.createProcedureSchema = Joi.object({
  patientId: Joi.number().required(),
  dentistId: Joi.number().required(),
  appointmentId: Joi.number().required(),
  treatmentId: Joi.number().required(),
  cost: Joi.number().optional(),
  notes: Joi.string().optional(),
});

exports.updateProcedureSchema = Joi.object({
  cost: Joi.number().optional(),
  notes: Joi.string().optional(),
});

exports.statusSchema = Joi.object({
  status: Joi.string().valid('planned', 'in_progress', 'completed', 'cancelled').required(),
});