const app = require('./src/app');
const config = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const { ensureSeed } = require('./src/seed/seed');

async function start() {
  try {
    await connectDB();
    await ensureSeed();
    app.listen(config.port, () => {
      console.log(`NOIRÉON API running on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    console.error('Is MongoDB running? Set MONGODB_URI in .env (e.g. a MongoDB Atlas connection string).');
    process.exit(1);
  }
}

start();
