import rateLimit from 'express-rate-limit';

/**
 * Recursively strips MongoDB operators ($gt, $ne, etc.) and script tags
 * from objects to prevent NoSQL Injection and basic XSS payloads.
 */
export const cleanObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Strip keys starting with '$' or containing '.' (NoSQL injection vectors)
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    sanitized[key] = cleanObject(value);
  }
  return sanitized;
};

/**
 * Express Middleware: Sanitizes req.body, req.query, and req.params
 */
export const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = cleanObject(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = cleanObject(req.params);
  }
  next();
};

/**
 * Strict Rate Limiter for Authentication Endpoints (Login / Register / Forgot Password)
 * Protects against credential stuffing & brute-force password guessing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // Limit each IP to 25 auth attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});
