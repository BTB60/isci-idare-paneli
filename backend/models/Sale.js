const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  // Sale ID
  saleId: {
    type: String,
    unique: true
  },
  
  // Customer info
  customer: {
    name: {
      type: String,
      required: true
    },
    contactPerson: String,
    phone: String,
    email: String,
    address: String,
    type: {
      type: String,
      enum: ['individual', 'company', 'government'],
      default: 'individual'
    }
  },
  
  // Sale date
  date: {
    type: Date,
    default: Date.now
  },
  
  // Items
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    productName: String,
    description: String,
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: String,
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  
  // Financial summary
  subtotal: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'AZN'
  },
  
  // Payment
  payment: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded', 'cancelled'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'check', 'credit', 'installment'],
      default: 'cash'
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      default: 0
    },
    installments: [{
      amount: Number,
      dueDate: Date,
      paid: {
        type: Boolean,
        default: false
      },
      paidAt: Date
    }]
  },
  
  // Delivery
  delivery: {
    method: {
      type: String,
      enum: ['pickup', 'delivery', 'shipping'],
      default: 'pickup'
    },
    address: String,
    scheduledDate: Date,
    deliveredAt: Date,
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    trackingNumber: String
  },
  
  // Salesperson
  salesperson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Commission
  commission: {
    rate: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      default: 0
    },
    paid: {
      type: Boolean,
      default: false
    },
    paidAt: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'draft'
  },
  
  // Related project
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  
  // Notes
  notes: String,
  
  // Documents
  documents: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['invoice', 'receipt', 'contract', 'quote', 'other']
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
saleSchema.index({ saleId: 1 });
saleSchema.index({ date: -1 });
saleSchema.index({ status: 1 });
saleSchema.index({ salesperson: 1 });
saleSchema.index({ 'customer.name': 'text' });

// Pre-save middleware to generate sale ID and calculate totals
saleSchema.pre('save', async function(next) {
  // Generate sale ID
  if (!this.saleId) {
    const date = new Date();
    const prefix = 'SALE';
    const timestamp = date.getFullYear().toString().substr(-2) +
                      String(date.getMonth() + 1).padStart(2, '0') +
                      String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.saleId = `${prefix}-${timestamp}-${random}`;
  }
  
  // Calculate item totals
  this.items.forEach(item => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDiscount = itemSubtotal * (item.discount / 100);
    const itemTax = (itemSubtotal - itemDiscount) * (item.tax / 100);
    item.total = itemSubtotal - itemDiscount + itemTax;
  });
  
  // Calculate summary
  this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  this.discount = this.items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    return sum + (itemSubtotal * (item.discount / 100));
  }, 0);
  this.tax = this.items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDiscount = itemSubtotal * (item.discount / 100);
    return sum + ((itemSubtotal - itemDiscount) * (item.tax / 100));
  }, 0);
  
  this.total = this.subtotal - this.discount + this.tax + this.shipping;
  
  // Calculate remaining amount
  this.payment.remainingAmount = this.total - this.payment.paidAmount;
  
  // Calculate commission
  if (this.commission.rate > 0) {
    this.commission.amount = (this.total * this.commission.rate / 100);
  }
  
  next();
});

// Static method to get sales statistics
saleSchema.statics.getStatistics = async function(startDate, endDate, salespersonId) {
  const matchStage = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    status: { $nin: ['cancelled', 'draft'] }
  };
  
  if (salespersonId) {
    matchStage.salesperson = new mongoose.Types.ObjectId(salespersonId);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$total' },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: '$total' },
        totalCommission: { $sum: '$commission.amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Sale', saleSchema);
