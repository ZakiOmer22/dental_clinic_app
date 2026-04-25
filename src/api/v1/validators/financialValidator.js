const Joi = require('joi');

exports.createInvoiceSchema = Joi.object({
  patientId: Joi.number().required(),
  totalAmount: Joi.number().required(),
});

exports.recordPaymentSchema = Joi.object({
  amount: Joi.number().required(),
  method: Joi.string().valid('cash', 'card', 'mobile', 'bank').required(),
});