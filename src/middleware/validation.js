const Joi = require('joi');
const logger = require('../utils/logger');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property]);
    
    if (error) {
      logger.warn('Validation error', {
        error: error.details[0].message,
        path: req.path,
        method: req.method
      });
      
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        field: error.details[0].path.join('.')
      });
    }
    
    req[property] = value;
    next();
  };
};

// Validation schemas
const createUrlSchema = Joi.object({
  url: Joi.string().uri({ scheme: ['http', 'https'] }).max(2048).required(),
  customCode: Joi.string().alphanum().min(3).max(20).optional(),
  expiration: Joi.date().greater('now').optional()
});

const bulkCreateSchema = Joi.object({
  urls: Joi.array().items(createUrlSchema).min(1).max(100).required()
});

const shortCodeSchema = Joi.object({
  shortCode: Joi.string().alphanum().min(3).max(20).required()
});

const analyticsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  days: Joi.number().integer().min(1).max(365).default(30)
});

module.exports = {
  validate,
  createUrlSchema,
  bulkCreateSchema,
  shortCodeSchema,
  analyticsQuerySchema
};