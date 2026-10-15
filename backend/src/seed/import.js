const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const Product = require('../models/Product');
const User = require('../models/User');
const data = require('./live-data.json');

// Import the portable catalogue + accounts into the target MongoDB (e.g. Atlas).
// Run with: MONGODB_URI=<atlas-uri> node src/seed/import.js
// or:       node src/seed/import.js <atlas-uri>
(async () => {
  const uri = process.argv[2] || process.env.MONGODB_URI;
  if (!uri) { console.error('No MONGODB_URI provided.'); process.exit(1); }
  await mongoose.connect(uri);

  await Product.deleteMany({});
  await Product.insertMany(data.products);

  let usersCreated = 0, usersUpdated = 0;
  for (const u of data.users) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      existing.name = u.name; existing.passwordHash = u.passwordHash; existing.role = u.role;
      await existing.save(); usersUpdated++;
    } else {
      // create bypasses the role setter trimming; set fields directly then save
      await User.create({ name: u.name, email: u.email, passwordHash: u.passwordHash, role: u.role });
      usersCreated++;
    }
  }

  const pc = await Product.countDocuments();
  const uc = await User.countDocuments();
  console.log(`Imported ${data.products.length} products (catalogue now ${pc}). Users: +${usersCreated} new, ~${usersUpdated} updated (total ${uc}).`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
