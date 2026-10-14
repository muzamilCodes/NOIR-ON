const User = require('../models/User');
const { generateToken } = require('../utils/token');
const asyncHandler = require('../utils/asyncHandler');

function publicUser(user) {
  return { id: String(user.id || user._id), name: user.name, email: user.email, role: user.role || 'user' };
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const normalizedEmail = String(email).toLowerCase().trim();
  if (await User.findOne({ email: normalizedEmail })) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }
  // Public sign-up always creates a normal user. Admins are provisioned via the seed only.
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash: await User.hashPassword(String(password)),
    role: 'user',
  });
  res.status(201).json({ token: generateToken(user), user: publicUser(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await user.matchPassword(String(password));
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: generateToken(user), user: publicUser(user) });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

module.exports = { register, login, me };
