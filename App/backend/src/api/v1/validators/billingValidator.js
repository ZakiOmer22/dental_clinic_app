const Joi = require('joi');

const createInvoiceSchema = Joi.object({
  patientId: Joi.number().integer().positive().required(),
  appointmentId: Joi.number().integer().positive().allow(null),
  invoiceDate: Joi.date().iso().default(() => new Date().toISOString().split('T')[0]),
  dueDate: Joi.date().iso().min(Joi.ref('invoiceDate')).required(),
  items: Joi.array().min(1).items(
    Joi.object({
      treatmentId: Joi.number().integer().positive().allow(null),
      description: Joi.string().max(255).required(),
      quantity: Joi.number().integer().min(1).default(1),
      unitPrice: Joi.number().precision(2).positive().required(),
      discount: Joi.number().precision(2).min(0).default(0),
      taxRate: Joi.number().precision(2).min(0).max(100).default(0),
    })
  ).required(),
  notes: Joi.string().allow('', null),
  paymentTerms: Joi.string().max(100).default('Due upon receipt'),
  currency: Joi.string().length(3).default('USD'),
  sendEmail: Joi.boolean().default(false),
});

const updateInvoiceSchema = Joi.object({
  dueDate: Joi.date().iso(),
  status: Joi.string().valid('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded'),
  notes: Joi.string().allow('', null),
  paymentTerms: Joi.string().max(100),
}).min(1);

const createPaymentSchema = Joi.object({
  invoiceId: Joi.number().integer().positive().required(),
  amount: Joi.number().precision(2).positive().required(),
  paymentDate: Joi.date().iso().default(() => new Date().toISOString().split('T')[0]),
  paymentMethod: Joi.string().valid('cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'insurance', 'other').required(),
  referenceNumber: Joi.string().max(100).allow('', null),
  notes: Joi.string().allow('', null),
  sendReceipt: Joi.boolean().default(false),
});

const invoiceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(10000).default(20),
  patientId: Joi.number().integer().positive(),
  status: Joi.string().valid('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded'),
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso(),
  minAmount: Joi.number().precision(2).positive(),
  maxAmount: Joi.number().precision(2).positive(),
  overdue: Joi.boolean().default(false),
  sortBy: Joi.string().valid('invoiceDate', 'dueDate', 'totalAmount', 'status', 'invoiceNumber').default('invoiceDate'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

const paymentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(10000).default(20),
  invoiceId: Joi.number().integer().positive(),
  patientId: Joi.number().integer().positive(),
  paymentMethod: Joi.string().valid('cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'insurance', 'other'),
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso(),
  sortBy: Joi.string().valid('paymentDate', 'amount', 'paymentMethod').default('paymentDate'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

module.exports = {
  createInvoiceSchema,
  updateInvoiceSchema,
  createPaymentSchema,
  invoiceQuerySchema,
  paymentQuerySchema,
};