const Joi = require('joi');

const createTreatmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  code: Joi.string().max(50).allow('', null),
  category: Joi.string().valid(
    'consultation', 'preventive', 'restorative', 'endodontic',
    'periodontic', 'prosthodontic', 'oral_surgery', 'orthodontic',
    'pediatric', 'cosmetic', 'emergency', 'other'
  ).default('other'),
  description: Joi.string().allow('', null),
  durationMinutes: Joi.number().integer().min(5).max(480).default(30),
  price: Joi.number().precision(2).min(0).required(),
  cost: Joi.number().precision(2).min(0).allow(null),
  toothSurface: Joi.string().valid(
    'buccal', 'lingual', 'mesial', 'distal', 'occlusal', 'incisal', 'facial', 'palatal', 'none'
  ).default('none'),
  requiresLab: Joi.boolean().default(false),
  insuranceCode: Joi.string().max(50).allow('', null),
  notes: Joi.string().allow('', null),
  isActive: Joi.boolean().default(true),
  colorCode: Joi.string().pattern(/^#[0-9A-F]{6}$/i).allow('', null),
  icon: Joi.string().max(50).allow('', null),
});

const updateTreatmentSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  code: Joi.string().max(50).allow('', null),
  category: Joi.string().valid(
    'consultation', 'preventive', 'restorative', 'endodontic',
    'periodontic', 'prosthodontic', 'oral_surgery', 'orthodontic',
    'pediatric', 'cosmetic', 'emergency', 'other'
  ),
  description: Joi.string().allow('', null),
  durationMinutes: Joi.number().integer().min(5).max(480),
  price: Joi.number().precision(2).min(0),
  cost: Joi.number().precision(2).min(0).allow(null),
  toothSurface: Joi.string().valid(
    'buccal', 'lingual', 'mesial', 'distal', 'occlusal', 'incisal', 'facial', 'palatal', 'none'
  ),
  requiresLab: Joi.boolean(),
  insuranceCode: Joi.string().max(50).allow('', null),
  notes: Joi.string().allow('', null),
  isActive: Joi.boolean(),
  colorCode: Joi.string().pattern(/^#[0-9A-F]{6}$/i).allow('', null),
  icon: Joi.string().max(50).allow('', null),
}).min(1);

const treatmentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  search: Joi.string().allow('', null),
  category: Joi.string(),
  isActive: Joi.boolean(),
  minPrice: Joi.number().precision(2).min(0),
  maxPrice: Joi.number().precision(2).min(0),
  requiresLab: Joi.boolean(),
  sortBy: Joi.string().valid('name', 'category', 'price', 'durationMinutes', 'createdAt').default('category'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
});

const treatmentCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().allow('', null),
  colorCode: Joi.string().pattern(/^#[0-9A-F]{6}$/i).allow('', null),
  isActive: Joi.boolean().default(true),
});

module.exports = {
  createTreatmentSchema,
  updateTreatmentSchema,
  treatmentQuerySchema,
  treatmentCategorySchema,
};