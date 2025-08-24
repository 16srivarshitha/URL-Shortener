const UrlService = require('../services/urlService');
const AnalyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');
const config = require('../config');

class UrlController {
  static async createShortUrl(req, res, next) {
    try {
      const result = await UrlService.createShortUrl(req.body);
      
      logger.info('Short URL created', { 
        shortCode: result.shortCode,
        originalUrl: result.originalUrl 
      });
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async redirectToOriginal(req, res, next) {
    try {
      const { shortCode } = req.params;
      const originalUrl = await UrlService.getOriginalUrl(shortCode);
      
      if (!originalUrl) {
        return res.status(404).json({
          error: 'URL not found',
          message: 'The requested short URL does not exist or has expired'
        });
      }
      
      // Increment click count asynchronously
      UrlService.incrementClickCount(shortCode);
      
      // Redirect to original URL
      res.redirect(301, originalUrl);
    } catch (error) {
      next(error);
    }
  }

  static async getUrlStats(req, res, next) {
    try {
      const { shortCode } = req.params;
      const stats = await UrlService.getUrlStats(shortCode);
      
      if (!stats) {
        return res.status(404).json({
          error: 'URL not found',
          message: 'The requested short URL does not exist'
        });
      }
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUrl(req, res, next) {
    try {
      const { shortCode } = req.params;
      const success = await UrlService.deleteUrl(shortCode);
      
      if (!success) {
        return res.status(404).json({
          error: 'URL not found',
          message: 'The requested short URL does not exist'
        });
      }
      
      res.json({
        success: true,
        message: 'URL deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkCreate(req, res, next) {
    try {
      const { urls } = req.body;
      const results = await UrlService.bulkCreateUrls(urls);
      
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      logger.info('Bulk URL creation completed', { successful, failed });
      
      res.status(201).json({
        success: true,
        data: {
          total: results.length,
          successful,
          failed,
          results
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUrlInfo(req, res, next) {
    try {
      const { shortCode } = req.params;
      const originalUrl = await UrlService.getOriginalUrl(shortCode);
      
      if (!originalUrl) {
        return res.status(404).json({
          error: 'URL not found',
          message: 'The requested short URL does not exist or has expired'
        });
      }
      
      const stats = await UrlService.getUrlStats(shortCode);
      
      res.json({
        success: true,
        data: {
          shortCode,
          shortUrl: `${config.url.baseUrl}/${shortCode}`,
          originalUrl: stats.original_url,
          clickCount: stats.click_count,
          createdAt: stats.created_at,
          expirationDate: stats.expiration_date
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UrlController;