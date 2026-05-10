const mongoose = require('mongoose');

const penaltySchema = new mongoose.Schema({
  // Worker
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Penalty details
  type: {
    type: String,
    enum: [
      'late', 'absence', 'early_leave', 'damage', 'violation',
      'insubordination', 'safety', 'quality', 'other'
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
  
  // Date of incident
  incidentDate: {
    type: Date,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'appealed', 'cancelled'],
    default: 'pending'
  },
  
  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  // Evidence
  evidence: [{
    type: {
      type: String,
      enum: ['photo', 'video', 'document', 'witness']
    },
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Appeal
  appeal: {
    appealed: {
      type: Boolean,
      default: false
    },
    reason: String,
    submittedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    decision: String
  },
  
  // Related to
  relatedTo: {
    model: String,
    id: mongoose.Schema.Types.ObjectId
  },
  
  // Deducted from salary
  deducted: {
    type: Boolean,
    default: false
  },
  deductedFrom: {
    year: Number,
    month: Number
  },
  
  // Warning level
  warningLevel: {
    type: String,
    enum: ['verbal', 'written', 'final', 'termination'],
    default: 'written'
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
penaltySchema.index({ worker: 1 });
penaltySchema.index({ status: 1 });
penaltySchema.index({ type: 1 });
penaltySchema.index({ incidentDate: -1 });

// Static method to get worker's total penalties
penaltySchema.statics.getWorkerTotal = async function(workerId, year, month) {
  const query = { 
    worker: workerId, 
    status: 'approved',
    deducted: false
  };
  
  if (year && month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    query.incidentDate = { $gte: startDate, $lte: endDate };
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

module.exports = mongoose.model('Penalty', penaltySchema);
