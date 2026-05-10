const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // Worker reference
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
  
  // Check-in details
  checkIn: {
    time: {
      type: String,
      required: true
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    device: String,
    ip: String,
    method: {
      type: String,
      enum: ['manual', 'qr', 'biometric', 'gps', 'web', 'voice'],
      default: 'manual'
    },
    photo: String, // URL to check-in photo
    notes: String,
    voiceTranscript: String,
    voicePhraseUsed: String
  },
  
  // Check-out details
  checkOut: {
    time: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    device: String,
    ip: String,
    method: {
      type: String,
      enum: ['manual', 'qr', 'biometric', 'gps', 'web', 'voice'],
      default: 'manual'
    },
    photo: String,
    notes: String,
    voiceTranscript: String,
    voicePhraseUsed: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'early_leave', 'excused', 'half_day', 'on_leave', 'holiday', 'pending'],
    default: 'pending'
  },
  
  // Work hours calculation
  workHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  
  // Late/Early calculations
  lateMinutes: {
    type: Number,
    default: 0
  },
  earlyLeaveMinutes: {
    type: Number,
    default: 0
  },
  
  // Shift info
  shift: {
    name: String,
    startTime: String,
    endTime: String,
    isNightShift: {
      type: Boolean,
      default: false
    }
  },
  
  // Breaks
  breaks: [{
    startTime: String,
    endTime: String,
    duration: Number, // in minutes
    type: {
      type: String,
      enum: ['lunch', 'tea', 'prayer', 'other'],
      default: 'other'
    }
  }],
  
  // Approval workflow
  approval: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String
  },
  
  // QR Code for attendance
  qrCode: {
    code: String,
    generatedAt: Date,
    expiresAt: Date,
    used: {
      type: Boolean,
      default: false
    }
  },
  
  // Notes
  notes: String,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance records
attendanceSchema.index({ worker: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ 'approval.status': 1 });

// Pre-save middleware to calculate work hours
attendanceSchema.pre('save', function(next) {
  if (this.checkIn.time && this.checkOut.time) {
    const checkIn = new Date(`2000-01-01T${this.checkIn.time}`);
    const checkOut = new Date(`2000-01-01T${this.checkOut.time}`);
    
    let diffMs = checkOut - checkIn;
    
    // Handle overnight shifts
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }
    
    // Convert to hours
    this.workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    
    // Subtract breaks
    const breakMinutes = this.breaks.reduce((total, b) => total + (b.duration || 0), 0);
    this.workHours = parseFloat((this.workHours - (breakMinutes / 60)).toFixed(2));
    
    // Calculate overtime (assuming 8 hours standard)
    if (this.workHours > 8) {
      this.overtimeHours = parseFloat((this.workHours - 8).toFixed(2));
    }
  }
  
  next();
});

// Method to calculate late minutes
attendanceSchema.methods.calculateLateMinutes = function(shiftStartTime) {
  if (!this.checkIn.time || !shiftStartTime) return 0;
  
  const checkIn = new Date(`2000-01-01T${this.checkIn.time}`);
  const shiftStart = new Date(`2000-01-01T${shiftStartTime}`);
  
  const diffMs = checkIn - shiftStart;
  if (diffMs > 0) {
    return Math.floor(diffMs / (1000 * 60));
  }
  return 0;
};

// Static method to get attendance summary
attendanceSchema.statics.getSummary = async function(workerId, startDate, endDate) {
  const matchStage = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (workerId) {
    matchStage.worker = new mongoose.Types.ObjectId(workerId);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalWorkHours: { $sum: '$workHours' },
        totalOvertime: { $sum: '$overtimeHours' }
      }
    }
  ]);
};

module.exports = mongoose.model('Attendance', attendanceSchema);
