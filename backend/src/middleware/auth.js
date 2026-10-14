const jwt = require('jsonwebtoken');
const config = require('../config/env');

// Verifies the Bearer token and attaches req.userId / req.userRole.
function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.id;
    req.userRole = decoded.role || 'user';
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Must run after protect().
function adminOnly(req, res, next) {
  if (req.userRole !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

module.exports = { protect, adminOnly };
