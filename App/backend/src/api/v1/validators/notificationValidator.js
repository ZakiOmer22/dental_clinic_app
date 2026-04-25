const Joi = require('joi');

exports.createNotificationSchema = Joi.object({
  userId: Joi.number().required(),
  clinicId: Joi.number().required(),
  type: Joi.string().required(),
  title: Joi.string().required(),
  message: Joi.string().required(),
  metadata: Joi.object().optional(),
});