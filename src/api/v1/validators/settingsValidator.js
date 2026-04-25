const Joi = require('joi');

exports.updateSettingsSchema = Joi.object({
  slotDuration: Joi.number().min(5).max(240).required(),
  maxAppointmentsPerDay: Joi.number().min(1).required(),
  currency: Joi.string().required(),
  workingHours: Joi.object({
    start: Joi.string().required(),
    end: Joi.string().required(),
  }).required(),
  notificationsEnabled: Joi.boolean().required(),
});