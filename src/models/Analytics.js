const db = require('../config/database');
const logger = require('../utils/logger');

class Analytics {
  static async recordClick(analyticsData) {
    const query = `
      INSERT INTO analytics (
        short_code, ip_address, user_agent, referrer, 
        country, city, browser, os, device, clicked_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [
        analyticsData.shortCode,
        analyticsData.ipAddress,
        analyticsData.userAgent,
        analyticsData.referrer,
        analyticsData.country,
        analyticsData.city,
        analyticsData.browser,
        analyticsData.os,
        analyticsData.device
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording click analytics', error);
      throw error;
    }
  }

  static async getClickStats(shortCode, days = 30) {
    const query = `
      SELECT 
        DATE(clicked_at) as date,
        COUNT(*) as clicks
      FROM analytics 
      WHERE short_code = $1 
      AND clicked_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(clicked_at)
      ORDER BY date DESC
    `;
    
    try {
      const result = await db.query(query, [shortCode]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting click stats', error);
      throw error;
    }
  }

  static async getLocationStats(shortCode) {
    const query = `
      SELECT 
        country,
        city,
        COUNT(*) as clicks
      FROM analytics 
      WHERE short_code = $1 
      GROUP BY country, city
      ORDER BY clicks DESC
      LIMIT 50
    `;
    
    try {
      const result = await db.query(query, [shortCode]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting location stats', error);
      throw error;
    }
  }

  static async getBrowserStats(shortCode) {
    const query = `
      SELECT 
        browser,
        COUNT(*) as clicks
      FROM analytics 
      WHERE short_code = $1 
      GROUP BY browser
      ORDER BY clicks DESC
    `;
    
    try {
      const result = await db.query(query, [shortCode]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting browser stats', error);
      throw error;
    }
  }

  static async getDetailedAnalytics(shortCode, limit = 100, offset = 0) {
    const query = `
      SELECT 
        ip_address, user_agent, referrer, country, city, 
        browser, os, device, clicked_at
      FROM analytics 
      WHERE short_code = $1
      ORDER BY clicked_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result = await db.query(query, [shortCode, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting detailed analytics', error);
      throw error;
    }
  }
}

module.exports = Analytics;