const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    qty: Number,
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    line2: { type: String, default: '' },
    city: String,
    state: String,
    pincode: String,
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, default: '' },
    items: { type: [orderItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    address: { type: addressSchema, required: true },
    paymentMethod: { type: String, enum: ['Card', 'UPI', 'Cash on Delivery'], default: 'Card' },
    status: { type: String, enum: ['Confirmed', 'Paid', 'Shipped', 'Delivered', 'Cancelled'], default: 'Paid' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        // frontend expects userId + date
        ret.userId = ret.user ? ret.user.toString() : ret.userId;
        ret.date = ret.createdAt ? new Date(ret.createdAt).toISOString() : new Date().toISOString();
        delete ret.user;
        delete ret.createdAt;
        // expose item.id (product id) alongside the name/price/qty snapshot
        ret.items = (ret.items || []).map((it) => ({
          id: it.product ? it.product.toString() : undefined,
          name: it.name,
          price: it.price,
          qty: it.qty,
        }));
        return ret;
      },
    },
  },
);

module.exports = mongoose.model('Order', orderSchema);
