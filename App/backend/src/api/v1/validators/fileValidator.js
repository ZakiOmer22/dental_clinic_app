const Joi = require('joi');

exports.uploadFileSchema = Joi.object({
  entityType: Joi.string().valid(
    'patient',
    'appointment',
    'referral',
    'consent'
  ).required(),
  entityId: Joi.number().optional(),
});