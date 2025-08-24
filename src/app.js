const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes/api');
const redirectRoutes = require('./routes/redirect');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));

// Performance middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', apiRoutes);
app.use('/', redirectRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;