const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Rate limiting middleware
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// URL validation middleware
const validateUrl = [
  body('url')
    .notEmpty()
    .withMessage('URL is required')
    .isLength({ max: 2048 })
    .withMessage('URL is too long')
    .custom((value) => {
      // Basic URL validation
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      
      // Add protocol if missing
      let url = value;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Validate URL format
      if (!urlPattern.test(url)) {
        throw new Error('Invalid URL format');
      }
      
      // Check for localhost/private IPs in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = new URL(url).hostname;
        const privateIpPattern = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|localhost)/;
        if (privateIpPattern.test(hostname)) {
          throw new Error('Private/local URLs are not allowed');
        }
      }
      
      return true;
    }),
  
  body('customAlias')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Custom alias must be between 3-50 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Custom alias can only contain letters, numbers, hyphens, and underscores'),
    
  body('ttlDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('TTL must be between 1-365 days')
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

// URL sanitization
const sanitizeUrl = (url) => {
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Remove trailing slash
  url = url.replace(/\/$/, '');
  
  return url;
};

module.exports = {
  createRateLimiter,
  validateUrl,
  handleValidationErrors,
  securityHeaders,
  sanitizeUrl
};
