const Cart = require('../models/Cart');
const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const REQUIRED_ADDRESS = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'];
const METHODS = ['Card', 'UPI', 'Cash on Delivery'];

// POST /api/orders  { address, paymentMethod }
const createOrder = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.userId }).populate('items.product');
  const entries = (cart ? cart.items : []).filter((i) => i.product);
  if (!entries.length) return res.status(400).json({ error: 'Cart is empty' });

  const { address, paymentMethod } = req.body || {};
  if (!address || REQUIRED_ADDRESS.some((k) => !String(address[k] || '').trim())) {
    return res.status(400).json({ error: 'A complete shipping address is required' });
  }
  const method = METHODS.includes(paymentMethod) ? paymentMethod : 'Card';

  const items = entries.map((i) => ({
    product: i.product._id,
    name: i.product.name,
    price: i.product.price,
    qty: i.qty,
  }));
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const owner = await User.findById(req.userId);

  const order = await Order.create({
    user: req.userId,
    email: owner ? owner.email : '',
    items,
    total,
    address: {
      fullName: String(address.fullName).trim(),
      phone: String(address.phone).trim(),
      line1: String(address.line1).trim(),
      line2: String(address.line2 || '').trim(),
      city: String(address.city).trim(),
      state: String(address.state).trim(),
      pincode: String(address.pincode).trim(),
    },
    paymentMethod: method,
    status: method === 'Cash on Delivery' ? 'Confirmed' : 'Paid',
  });

  cart.items = [];
  await cart.save();
  res.status(201).json(order);
});

// GET /api/orders
const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(orders);
});

module.exports = { createOrder, myOrders };
