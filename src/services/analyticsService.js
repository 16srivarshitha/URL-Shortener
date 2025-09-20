const Analytics = require('../models/Analytics');
const geoip = require('geoip-lite');
const useragent = require('useragent');
const logger = require('../utils/logger');

class AnalyticsService {
  static async recordClick(shortCode, req) {
    try {
      const ip = this.getClientIP(req);
      const geo = geoip.lookup(ip);
      const agent = useragent.parse(req.get('User-Agent'));

      const analyticsData = {
        shortCode,
        ipAddress: this.hashIP(ip), // Privacy: hash IPs
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referrer') || 'direct',
        country: geo?.country || 'Unknown',
        city: geo?.city || 'Unknown',
        browser: agent.family || 'Unknown',
        os: agent.os.family || 'Unknown',
        device: this.getDeviceType(agent)
      };

      // Batch analytics to avoid performance impact
      await this.batchAnalytics(analyticsData);
    } catch (error) {
      logger.error('Analytics recording failed:', error);
      // Don't throw - analytics shouldn't break core functionality
    }
  }

  static getClientIP(req) {
    return req.ip ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           'unknown';
  }

  static async getAnalyticsSummary(shortCode) {
    try {
      const [clickStats, locationStats, browserStats] = await Promise.all([
        Analytics.getClickStats(shortCode),
        Analytics.getLocationStats(shortCode),
        Analytics.getBrowserStats(shortCode)
      ]);

      return {
        clicksByDate: clickStats,
        topLocations: locationStats,
        browserStats: browserStats
      };
    } catch (error) {
      logger.error('Error getting analytics summary', error);
      throw error;
    }
  }

  static async getDetailedAnalytics(shortCode, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      const analytics = await Analytics.getDetailedAnalytics(shortCode, limit, offset);
      
      return {
        data: analytics,
        page,
        limit,
        hasMore: analytics.length === limit
      };
    } catch (error) {
      logger.error('Error getting detailed analytics', error);
      throw error;
    }
  }
}

module.exports = AnalyticsService;