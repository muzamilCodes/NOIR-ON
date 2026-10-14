const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const ORDER_STATUSES = ['Confirmed', 'Paid', 'Shipped', 'Delivered', 'Cancelled'];

// GET /api/admin/stats
const stats = asyncHandler(async (_req, res) => {
  const [products, orders, users, revenueAgg, delivered, pending] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(),
    User.countDocuments(),
    Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments({ status: 'Delivered' }),
    Order.countDocuments({ status: { $in: ['Confirmed', 'Paid', 'Shipped'] } }),
  ]);
  res.json({
    products,
    orders,
    users,
    revenue: revenueAgg[0] ? revenueAgg[0].total : 0,
    delivered,
    pending,
  });
});

// GET /api/admin/orders
const allOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

// PUT /api/admin/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid order status' });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Order not found' });
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// GET /api/admin/users
const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).select('name email role createdAt');
  res.json(
    users.map((u) => ({
      id: String(u.id || u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      date: u.createdAt ? new Date(u.createdAt).toISOString() : null,
    })),
  );
});

// POST /api/admin/products
const addProduct = asyncHandler(async (req, res) => {
  const { name, price, category = 'Skeleton', tagline = '', description = '', caseColor = 0xc9a06a, strapColor = 0x0e0e10, image = '', specs } = req.body || {};
  if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });
  const product = await Product.create({
    name: String(name).trim(),
    price: Number(price),
    category,
    tagline,
    description: description || tagline || name,
    caseColor: Number(caseColor) || 0xc9a06a,
    strapColor: Number(strapColor) || 0x0e0e10,
    image,
    specs: specs || { movement: 'Manual Cal. NR-T01', case: '42mm', water: '30m', power: '90h reserve' },
  });
  res.status(201).json(product);
});

// PUT /api/admin/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found' });
  const { name, price, category, tagline, description, caseColor, strapColor, image, specs } = req.body || {};
  const patch = {};
  if (name !== undefined) patch.name = String(name).trim();
  if (price !== undefined) patch.price = Number(price);
  if (category !== undefined) patch.category = category;
  if (tagline !== undefined) patch.tagline = tagline;
  if (description !== undefined) patch.description = description;
  if (caseColor !== undefined) patch.caseColor = Number(caseColor);
  if (strapColor !== undefined) patch.strapColor = Number(strapColor);
  if (image !== undefined) patch.image = image;
  if (specs !== undefined) patch.specs = specs;
  const product = await Product.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// DELETE /api/admin/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found' });
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ ok: true });
});

// POST /api/admin/upload  (multipart field name: "image")
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file received' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

module.exports = {
  stats,
  allOrders,
  updateOrderStatus,
  listUsers,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
};
