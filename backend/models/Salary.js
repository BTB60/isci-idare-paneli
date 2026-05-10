const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  // Worker reference
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Period
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  
  // Work details
  workDays: {
    type: Number,
    default: 0
  },
  workHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  
  // Base salary calculation
  dailySalary: {
    type: Number,
    default: 0
  },
  baseSalary: {
    type: Number,
    default: 0
  },
  
  // Overtime calculation
  overtimeRate: {
    type: Number,
    default: 1.5 // 1.5x normal rate
  },
  overtimePay: {
    type: Number,
    default: 0
  },
  
  // Additions
  bonuses: [{
    type: {
      type: String,
      enum: ['performance', 'attendance', 'holiday', 'referral', 'project', 'other'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  totalBonus: {
    type: Number,
    default: 0
  },
  
  // Deductions
  penalties: [{
    type: {
      type: String,
      enum: ['late', 'absence', 'damage', 'violation', 'other'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  totalPenalty: {
    type: Number,
    default: 0
  },
  
  // Advances (avans)
  advances: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    },
    description: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  totalAdvance: {
    type: Number,
    default: 0
  },
  
  // Taxes and deductions
  tax: {
    type: Number,
    default: 0
  },
  socialSecurity: {
    type: Number,
    default: 0
  },
  healthInsurance: {
    type: Number,
    default: 0
  },
  pension: {
    type: Number,
    default: 0
  },
  otherDeductions: {
    type: Number,
    default: 0
  },
  
  // Totals
  grossSalary: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  
  // Payment details
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'partial'],
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'check', 'mobile_payment'],
    default: 'bank_transfer'
  },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    swiftCode: String
  },
  transactionId: String,
  
  // Payslip
  payslipGenerated: {
    type: Boolean,
    default: false
  },
  payslipUrl: String,
  
  // Approval workflow
  approval: {
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String
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

// Compound index for unique salary records per worker per month
salarySchema.index({ worker: 1, year: 1, month: 1 }, { unique: true });
salarySchema.index({ year: -1, month: -1 });
salarySchema.index({ paymentStatus: 1 });
salarySchema.index({ 'approval.status': 1 });

// Pre-save middleware to calculate totals
salarySchema.pre('save', function(next) {
  // Calculate total bonuses
  this.totalBonus = this.bonuses.reduce((sum, b) => sum + b.amount, 0);
  
  // Calculate total penalties
  this.totalPenalty = this.penalties.reduce((sum, p) => sum + p.amount, 0);
  
  // Calculate total advances
  this.totalAdvance = this.advances.reduce((sum, a) => sum + a.amount, 0);
  
  // Calculate overtime pay
  const hourlyRate = this.dailySalary / 8; // Assuming 8-hour workday
  this.overtimePay = parseFloat((this.overtimeHours * hourlyRate * this.overtimeRate).toFixed(2));
  
  // Calculate base salary
  this.baseSalary = parseFloat((this.workDays * this.dailySalary).toFixed(2));
  
  // Calculate gross salary
  this.grossSalary = parseFloat((
    this.baseSalary + 
    this.overtimePay + 
    this.totalBonus - 
    this.totalPenalty
  ).toFixed(2));
  
  // Calculate net salary
  const totalDeductions = this.tax + this.socialSecurity + this.healthInsurance + 
                          this.pension + this.otherDeductions + this.totalAdvance;
  this.netSalary = parseFloat((this.grossSalary - totalDeductions).toFixed(2));
  
  next();
});

// Static method to get salary statistics
salarySchema.statics.getStatistics = async function(year, month) {
  const matchStage = {};
  if (year) matchStage.year = year;
  if (month) matchStage.month = month;
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalGross: { $sum: '$grossSalary' },
        totalNet: { $sum: '$netSalary' },
        totalBonuses: { $sum: '$totalBonus' },
        totalPenalties: { $sum: '$totalPenalty' },
        totalAdvances: { $sum: '$totalAdvance' },
        avgSalary: { $avg: '$netSalary' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Method to generate payslip data
salarySchema.methods.getPayslipData = function() {
  const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 
                  'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
  
  return {
    period: `${months[this.month - 1]} ${this.year}`,
    workDays: this.workDays,
    workHours: this.workHours,
    dailySalary: this.dailySalary,
    baseSalary: this.baseSalary,
    overtime: {
      hours: this.overtimeHours,
      rate: this.overtimeRate,
      pay: this.overtimePay
    },
    bonuses: this.bonuses,
    totalBonus: this.totalBonus,
    penalties: this.penalties,
    totalPenalty: this.totalPenalty,
    advances: this.advances,
    totalAdvance: this.totalAdvance,
    deductions: {
      tax: this.tax,
      socialSecurity: this.socialSecurity,
      healthInsurance: this.healthInsurance,
      pension: this.pension,
      other: this.otherDeductions
    },
    grossSalary: this.grossSalary,
    netSalary: this.netSalary,
    paymentStatus: this.paymentStatus,
    paymentDate: this.paymentDate
  };
};

module.exports = mongoose.model('Salary', salarySchema);
