const Url = require('../models/Url');
const CacheService = require('./cacheService');
const ShortCodeGenerator = require('../utils/shortCodeGenerator');
const UrlValidator = require('../utils/urlValidator');
const config = require('../config');
const logger = require('../utils/logger');

class UrlService {
  static async createShortUrl(urlData) {
    // Validate input
    const validatedData = UrlValidator.validateCreateUrlRequest(urlData);
    
    let shortCode = validatedData.customCode;
    
    // Generate short code if not provided
    if (!shortCode) {
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        shortCode = ShortCodeGenerator.generate();
        attempts++;
        
        const existing = await Url.findByShortCode(shortCode);
        if (!existing) break;
        
        if (attempts >= maxAttempts) {
          throw new Error('Unable to generate unique short code');
        }
      } while (attempts < maxAttempts);
    } else {
      // Check if custom code already exists
      const existing = await Url.findByShortCode(shortCode);
      if (existing) {
        throw new Error('Custom short code already exists');
      }
    }

    // Create URL record
    const urlRecord = await Url.create({
      shortCode,
      originalUrl: validatedData.url,
      expirationDate: validatedData.expiration
    });

    // Cache the URL
    const cacheKey = CacheService.generateUrlKey(shortCode);
    await CacheService.set(cacheKey, {
      originalUrl: urlRecord.original_url,
      expirationDate: urlRecord.expiration_date
    });

    return {
      shortCode: urlRecord.short_code,
      shortUrl: `${config.url.baseUrl}/${urlRecord.short_code}`,
      originalUrl: urlRecord.original_url,
      expirationDate: urlRecord.expiration_date,
      createdAt: urlRecord.created_at
    };
  }

  static async getOriginalUrl(shortCode) {
    // Try cache first
    const cacheKey = CacheService.generateUrlKey(shortCode);
    let urlData = await CacheService.get(cacheKey);
    
    if (!urlData) {
      // Fallback to database
      const urlRecord = await Url.findByShortCode(shortCode);
      if (!urlRecord) {
        return null;
      }
      
      urlData = {
        originalUrl: urlRecord.original_url,
        expirationDate: urlRecord.expiration_date
      };
      
      // Cache for next time
      await CacheService.set(cacheKey, urlData);
    }

    // Check expiration
    if (urlData.expirationDate && new Date(urlData.expirationDate) < new Date()) {
      // Remove expired URL from cache
      await CacheService.delete(cacheKey);
      return null;
    }

    return urlData.originalUrl;
  }

  static async incrementClickCount(shortCode) {
    try {
      await Url.updateClickCount(shortCode);
      
      // Update cached stats
      const statsKey = CacheService.generateStatsKey(shortCode);
      await CacheService.delete(statsKey);
    } catch (error) {
      logger.error('Error incrementing click count', error);
    }
  }

  static async getUrlStats(shortCode) {
    // Try cache first
    const statsKey = CacheService.generateStatsKey(shortCode);
    let stats = await CacheService.get(statsKey);
    
    if (!stats) {
      stats = await Url.getStats(shortCode);
      if (stats) {
        await CacheService.set(statsKey, stats, 300); // Cache for 5 minutes
      }
    }
    
    return stats;
  }

  static async deleteUrl(shortCode, userId = null) {
    const success = await Url.delete(shortCode, userId);
    
    if (success) {
      // Clear cache
      const cacheKey = CacheService.generateUrlKey(shortCode);
      const statsKey = CacheService.generateStatsKey(shortCode);
      await Promise.all([
        CacheService.delete(cacheKey),
        CacheService.delete(statsKey)
      ]);
    }
    
    return success;
  }

  static async bulkCreateUrls(urlsData) {
    const results = [];
    
    for (const urlData of urlsData) {
      try {
        const result = await this.createShortUrl(urlData);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message,
          originalUrl: urlData.url 
        });
      }
    }
    
    return results;
  }
}

module.exports = UrlService;