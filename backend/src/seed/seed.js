const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const catalogue = require('./products');

async function seedUsers() {
  const admin = await User.findOne({ email: 'admin@noireon.com' });
  if (!admin) {
    await User.create({
      name: 'NOIRÉON Admin',
      email: 'admin@noireon.com',
      passwordHash: await User.hashPassword('admin123'),
      role: 'admin',
    });
  }
  const demo = await User.findOne({ email: 'user@noireon.com' });
  if (!demo) {
    await User.create({
      name: 'Demo Collector',
      email: 'user@noireon.com',
      passwordHash: await User.hashPassword('user123'),
      role: 'user',
    });
  }
}

// Idempotent: only fills what is missing. Safe to call on every boot.
async function ensureSeed() {
  await seedUsers();
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(catalogue);
    console.log(`Seeded ${catalogue.length} products.`);
  }
}

// Destructive reset used by `npm run seed`.
async function runSeed() {
  await Promise.all([User.deleteMany({}), Product.deleteMany({}), Cart.deleteMany({}), Order.deleteMany({})]);
  await seedUsers();
  await Product.insertMany(catalogue);
  console.log('Database reset and seeded: 2 users (admin + demo), %d products.', catalogue.length);
  console.log('  admin@noireon.com / admin123   (role: admin)');
  console.log('  user@noireon.com  / user123    (role: user)');
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await runSeed();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('Seed failed:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = { ensureSeed, runSeed };
