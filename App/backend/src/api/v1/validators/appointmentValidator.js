const Joi = require('joi');

const createAppointmentSchema = Joi.object({
  patientId: Joi.number().integer().positive().required(),
  dentistId: Joi.number().integer().positive().required(),
  clinicId: Joi.number().integer().positive(),
  appointmentDate: Joi.date().iso().required(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  treatmentType: Joi.string().max(100).required(),
  treatmentId: Joi.number().integer().positive().allow(null),
  status: Joi.string().valid('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show').default('scheduled'),
  notes: Joi.string().allow('', null),
  chiefComplaint: Joi.string().allow('', null),
  isEmergency: Joi.boolean().default(false),
  reminderSent: Joi.boolean().default(false),
  confirmationSent: Joi.boolean().default(false),
});

const updateAppointmentSchema = Joi.object({
  patientId: Joi.number().integer().positive(),
  dentistId: Joi.number().integer().positive(),
  appointmentDate: Joi.date().iso(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  treatmentType: Joi.string().max(100),
  treatmentId: Joi.number().integer().positive().allow(null),
  status: Joi.string().valid('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'),
  notes: Joi.string().allow('', null),
  chiefComplaint: Joi.string().allow('', null),
  isEmergency: Joi.boolean(),
  reminderSent: Joi.boolean(),
  confirmationSent: Joi.boolean(),
}).min(1);

const appointmentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  patientId: Joi.number().integer().positive(),
  dentistId: Joi.number().integer().positive(),
  status: Joi.string().valid('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'),
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso(),
  today: Joi.boolean().default(false),
  upcoming: Joi.boolean().default(false),
  sortBy: Joi.string().valid('appointmentDate', 'startTime', 'status', 'createdAt').default('appointmentDate'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
});

const checkAvailabilitySchema = Joi.object({
  dentistId: Joi.number().integer().positive().required(),
  appointmentDate: Joi.date().iso().required(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  excludeAppointmentId: Joi.number().integer().positive(),
});

module.exports = {
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentQuerySchema,
  checkAvailabilitySchema,
};