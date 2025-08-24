const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');

const PORT = config.port || 3000;

const server = app.listen(PORT, () => {
  logger.info(`URL Shortener server running on port ${PORT}`);
  logger.info(`Environment: ${config.env}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});