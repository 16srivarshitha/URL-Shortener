const AnalyticsService = require('../services/analyticsService');
const UrlService = require('../services/urlService');
const logger = require('../utils/logger');

class AnalyticsController {
  static async getAnalyticsSummary(req, res, next) {
    try {
      const { shortCode } = req.params;
      const { days } = req.query;
      
      // Verify URL exists
      const urlStats = await UrlService.getUrlStats(shortCode);
      if (!urlStats) {
        return res.status(404).json({
          error: 'URL not found',
          message: 'The requested short URL does not exist'
        });
      }
      
      const analytics = await AnalyticsService.getAnalyticsSummary(shortCode);
      
      res.json({
        success: true,
        data: {
          shortCode,
          totalClicks: urlStats.click_count,
          analytics
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDetailedAnalytics(req, res, next) {
    try {
      const { shortCode } = req.params;
      const { page, limit } = req.query;
      
      // Verify URL exists
      const urlStats = await UrlService.getUrlStats(shortCode);
      if (!urlStats) {
        return res.status(404).json({
          error: 'URL not found',
          message: 'The requested short URL does not exist'
        });
      }
      
      const analytics = await AnalyticsService.getDetailedAnalytics(
        shortCode, 
        parseInt(page), 
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AnalyticsController;