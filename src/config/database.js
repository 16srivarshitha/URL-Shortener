const { Pool } = require('pg');
const config = require('./index');
const logger = require('../utils/logger');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.username,
  password: config.database.password,
  min: config.database.pool.min,
  max: config.database.pool.max,
  acquireTimeoutMillis: config.database.pool.acquire,
  idleTimeoutMillis: config.database.pool.idle
});

pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err);
});

module.exports = pool;