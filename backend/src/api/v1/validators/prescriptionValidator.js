const Joi = require('joi');

const createPrescriptionSchema = Joi.object({
  patientId: Joi.number().integer().positive().required(),
  appointmentId: Joi.number().integer().positive().allow(null),
  dentistId: Joi.number().integer().positive().required(),
  prescriptionDate: Joi.date().iso().default(() => new Date().toISOString().split('T')[0]),
  medications: Joi.array().min(1).items(
    Joi.object({
      medicationName: Joi.string().max(200).required(),
      genericName: Joi.string().max(200).allow('', null),
      strength: Joi.string().max(50).required(),
      form: Joi.string().valid(
        'tablet', 'capsule', 'suspension', 'syrup', 'injection',
        'cream', 'ointment', 'gel', 'drops', 'spray', 'inhaler', 'other'
      ).default('tablet'),
      dosage: Joi.string().max(100).required(),
      frequency: Joi.string().max(100).required(),
      duration: Joi.string().max(50).required(),
      quantity: Joi.number().integer().min(1).required(),
      refills: Joi.number().integer().min(0).default(0),
      instructions: Joi.string().allow('', null),
      warnings: Joi.string().allow('', null),
      startDate: Joi.date().iso().allow(null),
      endDate: Joi.date().iso().allow(null),
      isPRN: Joi.boolean().default(false),
    })
  ).required(),
  diagnosis: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
  pharmacyName: Joi.string().max(200).allow('', null),
  pharmacyPhone: Joi.string().max(20).allow('', null),
  pharmacyAddress: Joi.string().allow('', null),
  isControlledSubstance: Joi.boolean().default(false),
  deaNumber: Joi.string().max(20).allow('', null),
  sendElectronically: Joi.boolean().default(false),
  printImmediately: Joi.boolean().default(false),
});

const updatePrescriptionSchema = Joi.object({
  status: Joi.string().valid('active', 'completed', 'discontinued', 'expired', 'cancelled'),
  notes: Joi.string().allow('', null),
  pharmacyName: Joi.string().max(200).allow('', null),
  pharmacyPhone: Joi.string().max(20).allow('', null),
  pharmacyAddress: Joi.string().allow('', null),
  dispensedDate: Joi.date().iso().allow(null),
  dispensedBy: Joi.string().max(100).allow('', null),
}).min(1);

const addRefillSchema = Joi.object({
  refillDate: Joi.date().iso().default(() => new Date().toISOString().split('T')[0]),
  quantity: Joi.number().integer().min(1).required(),
  pharmacyName: Joi.string().max(200).allow('', null),
  notes: Joi.string().allow('', null),
});

const prescriptionQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  patientId: Joi.number().integer().positive(),
  dentistId: Joi.number().integer().positive(),
  status: Joi.string().valid('active', 'completed', 'discontinued', 'expired', 'cancelled'),
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso(),
  isControlledSubstance: Joi.boolean(),
  medicationName: Joi.string(),
  sortBy: Joi.string().valid('prescriptionDate', 'status', 'patientName').default('prescriptionDate'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
});

const medicationQuerySchema = Joi.object({
  search: Joi.string().min(2).required(),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

module.exports = {
  createPrescriptionSchema,
  updatePrescriptionSchema,
  addRefillSchema,
  prescriptionQuerySchema,
  medicationQuerySchema,
};