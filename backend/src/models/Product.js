const mongoose = require('mongoose');

const specsSchema = new mongoose.Schema(
  {
    movement: String,
    case: String,
    water: String,
    power: String,
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'Skeleton' },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    caseColor: { type: Number, default: 0xc9a06a },
    strapColor: { type: Number, default: 0x0e0e10 },
    specs: { type: specsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model('Product', productSchema);
