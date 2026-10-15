const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Export the current local catalogue + accounts into a portable JSON file so the
// exact same data can be imported into a cloud MongoDB (Atlas) for the live site.
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).toArray();
  const users = await db.collection('users').find({}).toArray();
  const out = {
    exportedAt: new Date().toISOString(),
    products: products.map((p) => ({
      name: p.name, price: p.price, category: p.category, tagline: p.tagline || '',
      description: p.description || '', caseColor: p.caseColor, strapColor: p.strapColor, image: p.image || '',
      specs: p.specs || {},
    })),
    users: users.map((u) => ({
      name: u.name, email: u.email, passwordHash: u.passwordHash, role: u.role || 'user',
    })),
  };
  const file = path.join(__dirname, 'live-data.json');
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`Exported ${out.products.length} products + ${out.users.length} users -> src/seed/live-data.json`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
