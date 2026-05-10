const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  // Worker requesting permission
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Permission type
  type: {
    type: String,
    enum: ['annual', 'sick', 'unpaid', 'maternity', 'paternity', 'bereavement', 'emergency', 'other'],
    required: true
  },
  
  // Dates
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Duration (calculated)
  days: {
    type: Number,
    default: 0
  },
  
  // Reason
  reason: {
    type: String,
    required: true,
    maxlength: [1000, 'Reason cannot exceed 1000 characters']
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  
  // Approval workflow
  approvals: [{
    level: {
      type: Number,
      default: 1
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comment: String,
    actionAt: Date
  }],
  
  // Current approver level
  currentApprovalLevel: {
    type: Number,
    default: 1
  },
  
  // Final decision
  finalDecision: {
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    at: Date,
    comment: String
  },
  
  // Paid/Unpaid
  isPaid: {
    type: Boolean,
    default: true
  },
  
  // Substitute/Replacement
  substitute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Handover notes
  handoverNotes: String,
  
  // Documents (medical certificate, etc.)
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Emergency contact during leave
  emergencyContact: {
    name: String,
    phone: String
  },
  
  // Return to work
  returnToWork: {
    returned: {
      type: Boolean,
      default: false
    },
    returnedAt: Date,
    notes: String
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
permissionSchema.index({ worker: 1 });
permissionSchema.index({ status: 1 });
permissionSchema.index({ startDate: 1 });
permissionSchema.index({ type: 1 });

// Pre-save middleware to calculate days
permissionSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  next();
});

// Method to approve
permissionSchema.methods.approve = async function(approverId, comment, level) {
  const approval = this.approvals.find(a => a.level === level);
  
  if (approval) {
    approval.approver = approverId;
    approval.status = 'approved';
    approval.comment = comment;
    approval.actionAt = new Date();
  }
  
  // Check if all approvals are done
  const allApproved = this.approvals.every(a => a.status === 'approved');
  
  if (allApproved) {
    this.status = 'approved';
    this.finalDecision = {
      by: approverId,
      at: new Date(),
      comment
    };
  } else {
    this.currentApprovalLevel++;
  }
  
  await this.save();
  return this;
};

// Method to reject
permissionSchema.methods.reject = async function(approverId, comment) {
  this.status = 'rejected';
  this.finalDecision = {
    by: approverId,
    at: new Date(),
    comment
  };
  
  // Update all pending approvals to rejected
  this.approvals.forEach(a => {
    if (a.status === 'pending') {
      a.status = 'rejected';
      a.actionAt = new Date();
    }
  });
  
  await this.save();
  return this;
};

// Static method to get pending permissions for approver
permissionSchema.statics.getPendingForApprover = async function(approverId) {
  return this.find({
    status: 'pending',
    'approvals.approver': approverId,
    'approvals.status': 'pending'
  }).populate('worker', 'firstName lastName');
};

module.exports = mongoose.model('Permission', permissionSchema);
