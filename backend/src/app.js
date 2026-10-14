const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// The Next.js frontend (http://localhost:3000) consumes this API; CORS is open for dev.
app.use(cors());
app.use(express.json());

// Product images uploaded via the admin panel are served straight from disk.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
