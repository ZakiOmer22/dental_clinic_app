const Joi = require('joi');

exports.createFeedbackSchema = Joi.object({
  type: Joi.string().valid('bug', 'feature', 'ui', 'performance', 'general').required(),
  message: Joi.string().required(),
  rating: Joi.number().min(1).max(5).optional(),
});

exports.updateFeedbackStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'reviewed', 'resolved').required(),
});