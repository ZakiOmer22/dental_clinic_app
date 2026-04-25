const Joi = require('joi');

exports.createRoomSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('treatment', 'surgery', 'consultation', 'lab').required(),
  capacity: Joi.number().min(1).optional(),
});

exports.updateRoomSchema = Joi.object({
  name: Joi.string().optional(),
  type: Joi.string().optional(),
  capacity: Joi.number().min(1).optional(),
  status: Joi.string().valid('active', 'inactive', 'maintenance').optional(),
});