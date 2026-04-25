const Joi = require('joi');

exports.createReferralSchema = Joi.object({
  patientId: Joi.number().required(),
  referredTo: Joi.number().required(),
  reason: Joi.string().required(),
  notes: Joi.string().optional(),
});

exports.updateReferralSchema = Joi.object({
  reason: Joi.string().optional(),
  notes: Joi.string().optional(),
});

exports.statusSchema = Joi.object({
  status: Joi.string().valid('pending', 'accepted', 'completed', 'rejected').required(),
});

exports.feedbackSchema = Joi.object({
  feedback: Joi.string().required(),
});