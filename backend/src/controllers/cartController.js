const mongoose = require('mongoose');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const asyncHandler = require('../utils/asyncHandler');

async function loadCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

function detailed(cart) {
  const items = cart.items
    .filter((i) => i.product)
    .map((i) => ({ ...i.product.toJSON(), qty: i.qty }));
  const total = items.reduce((sum, p) => sum + p.price * p.qty, 0);
  return { items, total };
}

// GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await loadCart(req.userId);
  res.json(detailed(cart));
});

// POST /api/cart  { productId, qty }
const addItem = asyncHandler(async (req, res) => {
  const { productId, qty = 1 } = req.body || {};
  if (!mongoose.isValidObjectId(productId)) return res.status(404).json({ error: 'Product not found' });
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const cart = await loadCart(req.userId);
  const addQty = Number(qty) || 1;
  const existing = cart.items.find((i) => String(i.product && i.product._id ? i.product._id : i.product) === String(productId));
  if (existing) existing.qty += addQty;
  else cart.items.push({ product: productId, qty: addQty });
  await cart.save();
  res.status(201).json({ ok: true });
});

// DELETE /api/cart/:productId
const removeItem = asyncHandler(async (req, res) => {
  const cart = await loadCart(req.userId);
  cart.items = cart.items.filter((i) => String(i.product && i.product._id ? i.product._id : i.product) !== String(req.params.productId));
  await cart.save();
  res.json({ ok: true });
});

// DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  const cart = await loadCart(req.userId);
  cart.items = [];
  await cart.save();
  res.json({ ok: true });
});

module.exports = { getCart, addItem, removeItem, clearCart };
