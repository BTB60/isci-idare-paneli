const mongoose = require('mongoose');

const overtimeSchema = new mongoose.Schema({
  // Worker
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Date
  date: {
    type: Date,
    required: true
  },
  
  // Hours
  hours: {
    type: Number,
    required: true,
    min: 0.5,
    max: 24
  },
  
  // Time details
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  
  // Type
  type: {
    type: String,
    enum: ['weekday', 'weekend', 'holiday', 'night'],
    default: 'weekday'
  },
  
  // Rate multiplier
  rate: {
    type: Number,
    default: 1.5,
    min: 1
  },
  
  // Calculated amount
  amount: {
    type: Number,
    default: 0
  },
  
  // Reason/Description
  reason: {
    type: String,
    required: true,
    maxlength: [1000, 'Reason cannot exceed 1000 characters']
  },
  
  // Project/Task
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
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
  
  // Compensatory time off (instead of payment)
  compensatoryTimeOff: {
    taken: {
      type: Boolean,
      default: false
    },
    hours: {
      type: Number,
      default: 0
    },
    takenOn: [Date]
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
overtimeSchema.index({ worker: 1 });
overtimeSchema.index({ date: -1 });
overtimeSchema.index({ status: 1 });
overtimeSchema.index({ type: 1 });

// Pre-save middleware to calculate amount
overtimeSchema.pre('save', async function(next) {
  if (this.isModified('hours') || this.isModified('rate')) {
    // Get worker's hourly rate
    const User = require('./User');
    const worker = await User.findById(this.worker);
    
    if (worker && worker.dailySalary) {
      const hourlyRate = worker.dailySalary / 8; // Assuming 8-hour workday
      this.amount = parseFloat((this.hours * hourlyRate * this.rate).toFixed(2));
    }
  }
  next();
});

// Static method to get worker's overtime summary
overtimeSchema.statics.getWorkerSummary = async function(workerId, year, month) {
  const query = { 
    worker: new mongoose.Types.ObjectId(workerId),
    status: 'approved',
    paid: false
  };
  
  if (year && month) {
    query.date = {
      $gte: new Date(year, month - 1, 1),
      $lte: new Date(year, month, 0)
    };
  }
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$type',
        totalHours: { $sum: '$hours' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Overtime', overtimeSchema);
