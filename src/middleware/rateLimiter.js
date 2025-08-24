const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const CacheService = require('../services/cacheService');
const config = require('../config');
const logger = require('../utils/logger');

// Redis store for rate limiting
const redisStore = {
  incr: async (key) => {
    const count = await CacheService.increment(key, config.rateLimit.windowMs / 1000);
    return { totalHits: count };
  },
  decrement: async (key) => {
    // Not implemented for simplicity
  },
  resetKey: async (key) => {
    await CacheService.delete(key);
  }
};

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  store: redisStore
});

// Stricter rate limiter for URL creation
const createUrlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many URL creation requests',
    message: 'Please try again in 15 minutes'
  },
  store: redisStore
});

// Speed limiter for redirect requests
const redirectSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100, // Allow 100 requests per 15 minutes at full speed
  delayMs: 500, // Add 500ms delay after delayAfter
  maxDelayMs: 20000, // Max delay of 20 seconds
  store: redisStore
});

// Custom rate limiter with different strategies
const customRateLimit = (options) => {
  const { max, windowMs, keyGenerator, skipSuccessfulRequests } = options;
  
  return async (req, res, next) => {
    try {
      const key = keyGenerator ? keyGenerator(req) : req.ip;
      const rateLimitKey = CacheService.generateRateLimitKey(key, 'custom');
      
      const count = await CacheService.increment(rateLimitKey, windowMs / 1000);
      
      if (count > max) {
        logger.warn('Rate limit exceeded', { 
          key, 
          count, 
          max, 
          endpoint: req.path 
        });
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${max} per ${windowMs / 1000} seconds`,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - count),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs)
      });
      
      next();
    } catch (error) {
      logger.error('Rate limiter error', error);
      next(); // Continue on error to avoid blocking requests
    }
  };
};

module.exports = {
  apiLimiter,
  createUrlLimiter,
  redirectSpeedLimiter,
  customRateLimit
};