const express = require('express');
const router = express.Router();

const UrlController = require('../controllers/urlController');
const AnalyticsController = require('../controllers/analyticsController');
const { validate, createUrlSchema, bulkCreateSchema, analyticsQuerySchema } = require('../middleware/validation');
const { apiLimiter, createUrlLimiter } = require('../middleware/rateLimiter');

// Apply API rate limiting to all routes
router.use(apiLimiter);

// URL management routes
router.post('/urls', 
  createUrlLimiter,
  validate(createUrlSchema),
  UrlController.createShortUrl
);

router.post('/urls/bulk',
  createUrlLimiter,
  validate(bulkCreateSchema),
  UrlController.bulkCreate
);

router.get('/urls/:shortCode',
  UrlController.getUrlInfo
);

router.get('/urls/:shortCode/stats',
  UrlController.getUrlStats
);

router.delete('/urls/:shortCode',
  UrlController.deleteUrl
);

// Analytics routes
router.get('/analytics/:shortCode/summary',
  validate(analyticsQuerySchema, 'query'),
  AnalyticsController.getAnalyticsSummary
);

router.get('/analytics/:shortCode/detailed',
  validate(analyticsQuerySchema, 'query'),
  AnalyticsController.getDetailedAnalytics
);

module.exports = router;