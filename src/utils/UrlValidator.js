const Joi = require('joi');

const urlSchema = Joi.string()
  .uri({ scheme: ['http', 'https'] })
  .max(2048)
  .required();

const customCodeSchema = Joi.string()
  .alphanum()
  .min(3)
  .max(20)
  .optional();

const expirationSchema = Joi.date()
  .greater('now')
  .optional();

class UrlValidator {
  static validateUrl(url) {
    const { error, value } = urlSchema.validate(url);
    if (error) {
      throw new Error(`Invalid URL: ${error.details[0].message}`);
    }
    return value;
  }

  static validateCustomCode(code) {
    if (!code) return null;
    
    const { error, value } = customCodeSchema.validate(code);
    if (error) {
      throw new Error(`Invalid custom code: ${error.details[0].message}`);
    }
    return value;
  }

  static validateExpiration(expiration) {
    if (!expiration) return null;
    
    const { error, value } = expirationSchema.validate(new Date(expiration));
    if (error) {
      throw new Error(`Invalid expiration date: ${error.details[0].message}`);
    }
    return value;
  }

  static validateCreateUrlRequest(body) {
    const schema = Joi.object({
      url: urlSchema,
      customCode: customCodeSchema,
      expiration: Joi.date().greater('now').optional()
    });

    const { error, value } = schema.validate(body);
    if (error) {
      throw new Error(error.details[0].message);
    }
    return value;
  }
}

module.exports = UrlValidator;