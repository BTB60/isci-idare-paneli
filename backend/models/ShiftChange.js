const mongoose = require('mongoose');

const shiftChangeSchema = new mongoose.Schema({
  // Workers involved
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Shift details
  requesterShift: {
    date: {
      type: Date,
      required: true
    },
    startTime: String,
    endTime: String,
    type: {
      type: String,
      enum: ['morning', 'afternoon', 'night', 'custom']
    }
  },
  targetShift: {
    date: {
      type: Date,
      required: true
    },
    startTime: String,
    endTime: String,
    type: {
      type: String,
      enum: ['morning', 'afternoon', 'night', 'custom']
    }
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
    enum: ['pending', 'target_approved', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  
  // Approvals
  targetApproval: {
    approved: {
      type: Boolean,
      default: false
    },
    at: Date,
    comment: String
  },
  
  adminApproval: {
    approved: {
      type: Boolean,
      default: false
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    at: Date,
    comment: String
  },
  
  // Impact assessment
  impact: {
    coverageAffected: {
      type: Boolean,
      default: false
    },
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
shiftChangeSchema.index({ requester: 1 });
shiftChangeSchema.index({ target: 1 });
shiftChangeSchema.index({ status: 1 });
shiftChangeSchema.index({ 'requesterShift.date': 1 });

// Method for target to approve
shiftChangeSchema.methods.targetApprove = async function(comment) {
  this.targetApproval.approved = true;
  this.targetApproval.at = new Date();
  this.targetApproval.comment = comment;
  this.status = 'target_approved';
  
  await this.save();
  return this;
};

// Method for admin to approve
shiftChangeSchema.methods.adminApprove = async function(adminId, comment) {
  this.adminApproval.approved = true;
  this.adminApproval.by = adminId;
  this.adminApproval.at = new Date();
  this.adminApproval.comment = comment;
  this.status = 'approved';
  
  await this.save();
  return this;
};

// Method to reject
shiftChangeSchema.methods.reject = async function(by, comment, isAdmin = false) {
  this.status = 'rejected';
  
  if (isAdmin) {
    this.adminApproval.by = by;
    this.adminApproval.comment = comment;
  } else {
    this.targetApproval.comment = comment;
  }
  
  await this.save();
  return this;
};

module.exports = mongoose.model('ShiftChange', shiftChangeSchema);
