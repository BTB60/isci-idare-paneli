const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  code: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Category
  category: {
    type: String,
    enum: [
      'cement', 'aggregate', 'steel', 'wood', 'electrical', 'plumbing',
      'paint', 'tools', 'equipment', 'safety', 'hardware', 'other'
    ],
    default: 'other'
  },
  
  // Unit
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'ton', 'piece', 'bag', 'meter', 'm2', 'm3', 'liter', 'set', 'box'],
    default: 'piece'
  },
  
  // Pricing
  price: {
    purchase: {
      type: Number,
      default: 0,
      min: 0
    },
    sale: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'AZN'
    }
  },
  
  // Inventory
  inventory: {
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0
    },
    available: {
      type: Number,
      default: 0
    },
    minStock: {
      type: Number,
      default: 10,
      min: 0
    },
    maxStock: {
      type: Number,
      default: 1000,
      min: 0
    },
    reorderPoint: {
      type: Number,
      default: 20,
      min: 0
    },
    location: String // Warehouse location
  },
  
  // Supplier info
  supplier: {
    name: String,
    contact: String,
    email: String,
    phone: String,
    address: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  
  // Images
  images: [String],
  
  // Specifications
  specifications: {
    brand: String,
    model: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: String
    },
    weight: {
      value: Number,
      unit: String
    },
    color: String,
    material: String,
    custom: mongoose.Schema.Types.Mixed
  },
  
  // Stock movements
  movements: [{
    type: {
      type: String,
      enum: ['in', 'out', 'adjustment', 'return', 'transfer']
    },
    quantity: Number,
    reason: String,
    reference: String, // Sale ID, Project ID, etc.
    date: {
      type: Date,
      default: Date.now
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
materialSchema.index({ code: 1 });
materialSchema.index({ category: 1 });
materialSchema.index({ status: 1 });
materialSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to calculate available quantity
materialSchema.pre('save', function(next) {
  this.inventory.available = this.inventory.quantity - this.inventory.reserved;
  next();
});

// Virtual for stock status
materialSchema.virtual('stockStatus').get(function() {
  if (this.inventory.available <= 0) return 'out_of_stock';
  if (this.inventory.available <= this.inventory.minStock) return 'low_stock';
  if (this.inventory.available >= this.inventory.maxStock) return 'overstock';
  return 'normal';
});

// Virtual for needs reorder
materialSchema.virtual('needsReorder').get(function() {
  return this.inventory.available <= this.inventory.reorderPoint;
});

// Method to add stock
materialSchema.methods.addStock = async function(quantity, reason, reference, by) {
  this.inventory.quantity += quantity;
  this.movements.push({
    type: 'in',
    quantity,
    reason,
    reference,
    by
  });
  await this.save();
  return this;
};

// Method to remove stock
materialSchema.methods.removeStock = async function(quantity, reason, reference, by) {
  if (this.inventory.available < quantity) {
    throw new Error('Insufficient stock');
  }
  
  this.inventory.quantity -= quantity;
  this.movements.push({
    type: 'out',
    quantity: -quantity,
    reason,
    reference,
    by
  });
  await this.save();
  return this;
};

// Static method to get low stock items
materialSchema.statics.getLowStock = async function() {
  return this.find({
    'inventory.available': { $lte: '$inventory.reorderPoint' },
    status: 'active'
  });
};

module.exports = mongoose.model('Material', materialSchema);
