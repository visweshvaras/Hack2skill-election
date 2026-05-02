const rateLimit = require('express-rate-limit');

/**
 * Global API rate limiter to prevent DDoS and brute-force attacks.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Too many requests from this IP, please try again after 15 minutes',
    code: 429
  }
});

module.exports = { apiLimiter };
