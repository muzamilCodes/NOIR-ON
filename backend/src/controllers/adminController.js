const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/stats
const stats = asyncHandler(async (_req, res) => {
  const [products, orders, users, revenueAgg] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(),
    User.countDocuments(),
    Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
  ]);
  res.json({ products, orders, users, revenue: revenueAgg[0] ? revenueAgg[0].total : 0 });
});

// GET /api/admin/orders
const allOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

// POST /api/admin/products
const addProduct = asyncHandler(async (req, res) => {
  const { name, price, category = 'Skeleton', tagline = '', caseColor = 0xc9a06a, strapColor = 0x0e0e10 } = req.body || {};
  if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });
  const product = await Product.create({
    name: String(name).trim(),
    price: Number(price),
    category,
    tagline,
    description: tagline || name,
    caseColor: Number(caseColor) || 0xc9a06a,
    strapColor: Number(strapColor) || 0x0e0e10,
    specs: { movement: 'Manual Cal. NR-T01', case: '42mm', water: '30m', power: '90h reserve' },
  });
  res.status(201).json(product);
});

// DELETE /api/admin/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found' });
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ ok: true });
});

module.exports = { stats, allOrders, addProduct, deleteProduct };
