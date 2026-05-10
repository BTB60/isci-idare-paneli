const mongoose = require('mongoose');
const { ALLOWED_PERMISSIONS } = require('../constants/permissions');

const roleSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 40,
      match: [/^[a-z0-9_-]+$/, 'Slug yalnız kiçik latın hərfləri, rəqəm, _ və - ola bilər']
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    landing: {
      type: String,
      enum: ['admin', 'seller', 'worker'],
      required: true
    },
    permissions: {
      type: [{ type: String, enum: ALLOWED_PERMISSIONS }],
      default: []
    },
    isBuiltIn: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

roleSchema.index({ active: 1, slug: 1 });

module.exports = mongoose.model('Role', roleSchema);
