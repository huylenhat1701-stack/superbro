const jwt = require('jsonwebtoken');
const { getDB } = require('../db/init');

const JWT_SECRET = process.env.JWT_SECRET || 'travel_suite_secret_key_2024';

/**
 * Middleware: Verify JWT token (required auth)
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const db = getDB();
  const blacklisted = db.prepare('SELECT token FROM blacklisted_tokens WHERE token = ?').get(token);
  if (blacklisted) {
    return res.status(401).json({ success: false, message: 'Token has been invalidated. Please login again.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/**
 * Middleware: Require specific role
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access restricted to: ${roles.join(', ')}` });
    }
    next();
  };
};

/**
 * Middleware: Optional auth (attach user if token present)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) { req.user = null; return next(); }

  try {
    const db = getDB();
    const blacklisted = db.prepare('SELECT token FROM blacklisted_tokens WHERE token = ?').get(token);
    if (blacklisted) { req.user = null; return next(); }
    req.user = jwt.verify(token, JWT_SECRET);
    req.token = token;
  } catch {
    req.user = null;
  }
  next();
};

module.exports = { authenticate, requireRole, optionalAuth, JWT_SECRET };
