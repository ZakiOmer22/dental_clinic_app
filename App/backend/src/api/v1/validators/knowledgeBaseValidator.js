const Joi = require('joi');

exports.createArticleSchema = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  category: Joi.string().required(),
  isPublished: Joi.boolean().optional(),
});

exports.updateArticleSchema = Joi.object({
  title: Joi.string().optional(),
  content: Joi.string().optional(),
  category: Joi.string().optional(),
  isPublished: Joi.boolean().optional(),
});