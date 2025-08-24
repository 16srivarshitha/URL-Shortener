const redis = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');

class CacheService {
  static async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error', error);
      return null;
    }
  }

  static async set(key, value, ttl = config.redis.ttl) {
    try {
      await redis.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error', error);
      return false;
    }
  }

  static async delete(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', error);
      return false;
    }
  }

  static async increment(key, expiry = 3600) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, expiry);
      }
      return count;
    } catch (error) {
      logger.error('Cache increment error', error);
      return 0;
    }
  }

  static generateUrlKey(shortCode) {
    return `url:${shortCode}`;
  }

  static generateStatsKey(shortCode) {
    return `stats:${shortCode}`;
  }

  static generateRateLimitKey(identifier, action) {
    return `ratelimit:${action}:${identifier}`;
  }
}

module.exports = CacheService;