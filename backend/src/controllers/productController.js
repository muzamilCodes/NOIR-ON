const mongoose = require('mongoose');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/products
const listProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find().sort({ createdAt: 1 });
  res.json(products);
});

// GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found' });
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

module.exports = { listProducts, getProduct };
