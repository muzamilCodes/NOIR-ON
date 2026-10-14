const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    // get: normalises on read so stray whitespace/casing from manual DB edits
    // (e.g. "admin\n") still resolves to a valid role instead of silently blocking access.
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      get: (v) => (v == null ? 'user' : String(v).trim().toLowerCase()),
      set: (v) => (v == null ? 'user' : String(v).trim().toLowerCase()),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
};

module.exports = mongoose.model('User', userSchema);
