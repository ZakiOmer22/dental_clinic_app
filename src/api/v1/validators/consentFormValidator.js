const Joi = require('joi');

exports.createConsentFormSchema = Joi.object({
  title: Joi.string().required(),
  contentHtml: Joi.string().required(),
});

exports.updateConsentFormSchema = Joi.object({
  title: Joi.string().optional(),
  contentHtml: Joi.string().optional(),
});

exports.assignSchema = Joi.object({
  patientId: Joi.number().required(),
});

exports.signSchema = Joi.object({
  signature: Joi.string().required(),
});