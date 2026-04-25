const Joi = require('joi');

const createItemSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  code: Joi.string().max(50).allow('', null),
  category: Joi.string().valid(
    'consumables', 'instruments', 'equipment', 'medications',
    'sterilization', 'ppe', 'office_supplies', 'other'
  ).default('consumables'),
  description: Joi.string().allow('', null),
  unit: Joi.string().max(20).required(),
  quantity: Joi.number().integer().min(0).default(0),
  minQuantity: Joi.number().integer().min(0).default(5),
  maxQuantity: Joi.number().integer().min(0).default(100),
  unitPrice: Joi.number().precision(2).min(0).required(),
  sellingPrice: Joi.number().precision(2).min(0),
  supplier: Joi.string().max(200).allow('', null),
  supplierCode: Joi.string().max(50).allow('', null),
  location: Joi.string().max(100).allow('', null),
  expiryDate: Joi.date().iso().allow(null),
  batchNumber: Joi.string().max(50).allow('', null),
  requiresPrescription: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  notes: Joi.string().allow('', null),
});

const updateItemSchema = Joi.object({
  name: Joi.string().min(2).max(200),
  code: Joi.string().max(50).allow('', null),
  category: Joi.string().valid(
    'consumables', 'instruments', 'equipment', 'medications',
    'sterilization', 'ppe', 'office_supplies', 'other'
  ),
  description: Joi.string().allow('', null),
  unit: Joi.string().max(20),
  minQuantity: Joi.number().integer().min(0),
  maxQuantity: Joi.number().integer().min(0),
  unitPrice: Joi.number().precision(2).min(0),
  sellingPrice: Joi.number().precision(2).min(0),
  supplier: Joi.string().max(200).allow('', null),
  supplierCode: Joi.string().max(50).allow('', null),
  location: Joi.string().max(100).allow('', null),
  expiryDate: Joi.date().iso().allow(null),
  batchNumber: Joi.string().max(50).allow('', null),
  requiresPrescription: Joi.boolean(),
  isActive: Joi.boolean(),
  notes: Joi.string().allow('', null),
}).min(1);

const stockInSchema = Joi.object({
  itemId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().precision(2).min(0),
  supplier: Joi.string().max(200).allow('', null),
  invoiceNumber: Joi.string().max(50).allow('', null),
  batchNumber: Joi.string().max(50).allow('', null),
  expiryDate: Joi.date().iso().allow(null),
  notes: Joi.string().allow('', null),
});

const stockOutSchema = Joi.object({
  itemId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).required(),
  reason: Joi.string().valid(
    'used', 'expired', 'damaged', 'lost', 'returned', 'transferred', 'other'
  ).required(),
  patientId: Joi.number().integer().positive().allow(null),
  appointmentId: Joi.number().integer().positive().allow(null),
  notes: Joi.string().allow('', null),
});

const inventoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow('', null),
  category: Joi.string(),
  isActive: Joi.boolean(),
  lowStock: Joi.boolean().default(false),
  expiringSoon: Joi.boolean().default(false),
  supplier: Joi.string(),
  location: Joi.string(),
  sortBy: Joi.string().valid('name', 'category', 'quantity', 'unitPrice', 'updatedAt').default('name'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
});

const transactionQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  itemId: Joi.number().integer().positive(),
  type: Joi.string().valid('in', 'out'),
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso(),
  sortBy: Joi.string().valid('transactionDate', 'quantity', 'type').default('transactionDate'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

module.exports = {
  createItemSchema,
  updateItemSchema,
  stockInSchema,
  stockOutSchema,
  inventoryQuerySchema,
  transactionQuerySchema,
};