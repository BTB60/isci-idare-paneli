const mongoose = require('mongoose');

const bonusSchema = new mongoose.Schema({
  // Worker
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Bonus details
  type: {
    type: String,
    enum: [
      'performance', 'attendance', 'holiday', 'referral', 'project',
      'overtime', 'quality', 'safety', 'loyalty', 'other'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'AZN'
  },
  
  // Description
  description: {
    type: String,
    required: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Date
  date: {
    type: Date,
    required: true,
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
  
  // Payment
  paid: {
    type: Boolean,
    default: false
  },
  paidAt: Date,
  paidWithSalary: {
    year: Number,
    month: Number
  },
  
  // Related to
  relatedTo: {
    model: String,
    id: mongoose.Schema.Types.ObjectId
  },
  
  // Criteria (for performance-based bonuses)
  criteria: {
    attendanceRate: Number,
    efficiencyScore: Number,
    qualityScore: Number,
    projectCompletion: Number
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
bonusSchema.index({ worker: 1 });
bonusSchema.index({ status: 1 });
bonusSchema.index({ type: 1 });
bonusSchema.index({ date: -1 });

// Static method to get worker's total bonuses
bonusSchema.statics.getWorkerTotal = async function(workerId, year, month) {
  const query = { 
    worker: workerId, 
    status: 'approved',
    paid: false
  };
  
  if (year && month) {
    query.date = {
      $gte: new Date(year, month - 1, 1),
      $lte: new Date(year, month, 0)
    };
  }
  
  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { total: 0, count: 0 };
};

module.exports = mongoose.model('Bonus', bonusSchema);
