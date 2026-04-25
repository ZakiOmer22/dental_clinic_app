const Joi = require('joi');

exports.createTicketSchema = Joi.object({
  title: Joi.string().required(),
  subject: Joi.string().allow(''),
  description: Joi.string().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  category: Joi.string().valid('bug', 'billing', 'system', 'user'),
}).unknown(true);

exports.updateTicketSchema = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional(),
});

exports.assignTicketSchema = Joi.object({
  assignedTo: Joi.number().required(),
});