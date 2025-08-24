const AnalyticsService = require('../services/analyticsService');

const trackAnalytics = async (req, res, next) => {
  // Store original redirect method
  const originalRedirect = res.redirect;
  
  // Override redirect method to capture analytics
  res.redirect = function(statusOrUrl, url) {
    const redirectUrl = url || statusOrUrl;
    const shortCode = req.params.shortCode;
    
    // Record analytics asynchronously
    if (shortCode) {
      AnalyticsService.recordClick(shortCode, req).catch(err => {
        // Log error but don't block the redirect
        console.error('Analytics recording failed:', err);
      });
    }
    
    // Call original redirect method
    return originalRedirect.call(this, statusOrUrl, url);
  };
  
  next();
};

module.exports = { trackAnalytics };