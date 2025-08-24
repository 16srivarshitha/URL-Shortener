const redis = require('redis');
const config = require('./index');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  database: config.redis.db
});

client.on('connect', () => {
  logger.info('Connected to Redis');
});

client.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

client.connect();

module.exports = client;