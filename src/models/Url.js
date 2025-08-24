const db = require('../config/database');
const logger = require('../utils/logger');

class Url {
  static async create(urlData) {
    const query = `
      INSERT INTO urls (short_code, original_url, expiration_date, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [
        urlData.shortCode,
        urlData.originalUrl,
        urlData.expirationDate
      ]);
      
      logger.info('URL created', { shortCode: urlData.shortCode });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating URL', error);
      throw error;
    }
  }

  static async findByShortCode(shortCode) {
    const query = `
      SELECT * FROM urls 
      WHERE short_code = $1 
      AND (expiration_date IS NULL OR expiration_date > NOW())
      AND deleted_at IS NULL
    `;
    
    try {
      const result = await db.query(query, [shortCode]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding URL by short code', error);
      throw error;
    }
  }

  static async updateClickCount(shortCode) {
    const query = `
      UPDATE urls 
      SET click_count = click_count + 1, updated_at = NOW()
      WHERE short_code = $1
      RETURNING click_count
    `;
    
    try {
      const result = await db.query(query, [shortCode]);
      return result.rows[0]?.click_count || 0;
    } catch (error) {
      logger.error('Error updating click count', error);
      throw error;
    }
  }

  static async findUserUrls(userId, limit = 50, offset = 0) {
    const query = `
      SELECT short_code, original_url, click_count, created_at, expiration_date
      FROM urls 
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result = await db.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding user URLs', error);
      throw error;
    }
  }

  static async delete(shortCode, userId = null) {
    const query = userId ? 
      'UPDATE urls SET deleted_at = NOW() WHERE short_code = $1 AND user_id = $2' :
      'UPDATE urls SET deleted_at = NOW() WHERE short_code = $1';
    
    const params = userId ? [shortCode, userId] : [shortCode];
    
    try {
      const result = await db.query(query, params);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting URL', error);
      throw error;
    }
  }

  static async getStats(shortCode) {
    const query = `
      SELECT 
        u.short_code,
        u.original_url,
        u.click_count,
        u.created_at,
        u.expiration_date,
        COUNT(a.id) as total_analytics_records
      FROM urls u
      LEFT JOIN analytics a ON u.short_code = a.short_code
      WHERE u.short_code = $1 AND u.deleted_at IS NULL
      GROUP BY u.short_code, u.original_url, u.click_count, u.created_at, u.expiration_date
    `;
    
    try {
      const result = await db.query(query, [shortCode]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting URL stats', error);
      throw error;
    }
  }
}

module.exports = Url;