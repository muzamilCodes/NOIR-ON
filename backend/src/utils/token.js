const jwt = require('jsonwebtoken');
const config = require('../config/env');

function generateToken(user) {
  return jwt.sign(
    { id: String(user.id || user._id), email: user.email, name: user.name, role: user.role || 'user' },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

module.exports = { generateToken };
