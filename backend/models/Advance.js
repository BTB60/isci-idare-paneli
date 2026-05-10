const mongoose = require('mongoose');

const advanceSchema = new mongoose.Schema({
  // Worker
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Amount
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'AZN'
  },
  
  // Reason
  reason: {
    type: String,
    required: true,
    maxlength: [1000, 'Reason cannot exceed 1000 characters']
  },
  
  // Date
  requestDate: {
    type: Date,
    default: Date.now
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  
  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalComment: String,
  
  // Payment
  paid: {
    type: Boolean,
    default: false
  },
  paidAt: Date,
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'mobile_payment'],
    default: 'cash'
  },
  transactionId: String,
  
  // Repayment
  repayment: {
    deductedFromSalary: {
      type: Boolean,
      default: true
    },
    deductedAmount: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      default: 0
    },
    deductions: [{
      year: Number,
      month: Number,
      amount: Number,
      deductedAt: Date
    }]
  },
  
  // Maximum allowed calculation
  maxAllowed: {
    type: Number,
    default: 0
  },
  
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
advanceSchema.index({ worker: 1 });
advanceSchema.index({ status: 1 });
advanceSchema.index({ requestDate: -1 });

// Pre-save middleware to calculate remaining amount
advanceSchema.pre('save', function(next) {
  if (this.repayment.deductedAmount > 0) {
    this.repayment.remainingAmount = this.amount - this.repayment.deductedAmount;
  } else {
    this.repayment.remainingAmount = this.amount;
  }
  next();
});

// Static method to get worker's pending advances
advanceSchema.statics.getWorkerPendingTotal = async function(workerId) {
  const result = await this.aggregate([
    { 
      $match: { 
        worker: new mongoose.Types.ObjectId(workerId),
        status: { $in: ['pending', 'approved', 'paid'] },
        'repayment.remainingAmount': { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$repayment.remainingAmount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { total: 0, count: 0 };
};

module.exports = mongoose.model('Advance', advanceSchema);
