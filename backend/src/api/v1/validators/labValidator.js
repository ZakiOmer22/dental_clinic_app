const Joi = require('joi');

const createLabOrderSchema = Joi.object({
  patientId: Joi.number().integer().positive().required(),
  dentistId: Joi.number().integer().positive().required(),
  appointmentId: Joi.number().integer().positive().allow(null),
  labId: Joi.number().integer().positive().required(),
  orderDate: Joi.date().iso().default(() => new Date().toISOString().split('T')[0]),
  dueDate: Joi.date().iso().min(Joi.ref('orderDate')).required(),
  items: Joi.array().min(1).items(
    Joi.object({
      treatmentId: Joi.number().integer().positive().allow(null),
      description: Joi.string().max(500).required(),
      toothNumber: Joi.string().max(10).allow('', null),
      shade: Joi.string().max(50).allow('', null),
      material: Joi.string().max(100).allow('', null),
      quantity: Joi.number().integer().min(1).default(1),
      unitPrice: Joi.number().precision(2).min(0).default(0),
      instructions: Joi.string().allow('', null),
      isRush: Joi.boolean().default(false),
    })
  ).required(),
  notes: Joi.string().allow('', null),
  shippingAddress: Joi.string().allow('', null),
  preferredShippingMethod: Joi.string().max(50).allow('', null),
  isRush: Joi.boolean().default(false),
  sendNotification: Joi.boolean().default(true),
});

const updateLabOrderSchema = Joi.object({
  status: Joi.string().valid(
    'draft', 'sent', 'received', 'in_progress', 'completed', 
    'shipped', 'delivered', 'cancelled', 'rejected'
  ),
  dueDate: Joi.date().iso(),
  notes: Joi.string().allow('', null),
  shippingAddress: Joi.string().allow('', null),
  preferredShippingMethod: Joi.string().max(50).allow('', null),
  isRush: Joi.boolean(),
}).min(1);

const updateItemStatusSchema = Joi.object({
  status: Joi.string().valid(
    'pending', 'in_progress', 'completed', 'shipped', 'delivered', 'rejected'
  ).required(),
  notes: Joi.string().allow('', null),
  completedDate: Joi.date().iso().allow(null),
});

const receiveOrderSchema = Joi.object({
  receivedDate: Joi.date().iso().default(() => new Date().toISOString().split('T')[0]),
  items: Joi.array().items(
    Joi.object({
      itemId: Joi.number().integer().positive().required(),
      receivedQuantity: Joi.number().integer().min(0).required(),
      condition: Joi.string().valid('good', 'damaged', 'incorrect', 'missing').default('good'),
      notes: Joi.string().allow('', null),
    })
  ),
  notes: Joi.string().allow('', null),
});

const labQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  patientId: Joi.number().integer().positive(),
  dentistId: Joi.number().integer().positive(),
  labId: Joi.number().integer().positive(),
  status: Joi.string(),
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso(),
  isRush: Joi.boolean(),
  overdue: Joi.boolean().default(false),
  sortBy: Joi.string().valid('orderDate', 'dueDate', 'status', 'patientName').default('orderDate'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

const createLabSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  code: Joi.string().max(50).allow('', null),
  contactPerson: Joi.string().max(100).allow('', null),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(20).required(),
  mobile: Joi.string().max(20).allow('', null),
  address: Joi.string().allow('', null),
  city: Joi.string().max(100).allow('', null),
  state: Joi.string().max(50).allow('', null),
  zipCode: Joi.string().max(20).allow('', null),
  country: Joi.string().max(50).default('USA'),
  website: Joi.string().uri().allow('', null),
  specialties: Joi.array().items(Joi.string()).default([]),
  priceList: Joi.object().default({}),
  defaultTurnaroundDays: Joi.number().integer().min(1).max(30).default(7),
  shippingMethods: Joi.array().items(Joi.string()).default(['Standard']),
  notes: Joi.string().allow('', null),
  isActive: Joi.boolean().default(true),
  rating: Joi.number().min(0).max(5).allow(null),
});

module.exports = {
  createLabOrderSchema,
  updateLabOrderSchema,
  updateItemStatusSchema,
  receiveOrderSchema,
  labQuerySchema,
  createLabSchema,
};