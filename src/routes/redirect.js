const express = require('express');
const router = express.Router();
const UrlController = require('../controllers/urlController');
const { trackAnalytics } = require('../middleware/analytics');
const { redirectSpeedLimiter } = require('../middleware/rateLimiter');

// Apply analytics tracking and speed limiting to redirects
router.use('/:shortCode', redirectSpeedLimiter, trackAnalytics);

// Redirect route
router.get('/:shortCode', UrlController.redirectToOriginal);

module.exports = router;