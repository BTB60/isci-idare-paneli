const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [200, 'Project name cannot exceed 200 characters']
  },
  code: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Client Info
  client: {
    name: String,
    contactPerson: String,
    phone: String,
    email: String,
    address: String
  },
  
  // Location
  location: {
    address: String,
    city: String,
    region: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Project Type
  type: {
    type: String,
    enum: ['Residential', 'Commercial', 'Industrial', 'Infrastructure', 'Renovation', 'Other'],
    default: 'Residential'
  },
  
  // Timeline
  startDate: {
    type: Date,
    required: true
  },
  expectedEndDate: {
    type: Date,
    required: true
  },
  actualEndDate: {
    type: Date,
    default: null
  },
  
  // Budget
  budget: {
    estimated: {
      type: Number,
      required: true,
      min: 0
    },
    actual: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'AZN'
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  
  // Progress
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Team
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  team: [{
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Manager', 'Engineer', 'Foreman', 'Worker', 'Consultant', 'Other']
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    removedAt: Date
  }],
  
  // Phases/Milestones
  phases: [{
    name: String,
    description: String,
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'delayed'],
      default: 'pending'
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],
  
  // Tasks
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  
  // Materials
  materials: [{
    name: String,
    quantity: Number,
    unit: String,
    estimatedCost: Number,
    actualCost: Number,
    supplier: String,
    status: {
      type: String,
      enum: ['ordered', 'delivered', 'in_use', 'completed'],
      default: 'ordered'
    }
  }],
  
  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['contract', 'blueprint', 'permit', 'invoice', 'report', 'photo', 'other']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Daily Reports
  dailyReports: [{
    date: Date,
    weather: {
      condition: String,
      temperature: Number
    },
    workersPresent: Number,
    workDone: String,
    issues: String,
    photos: [String],
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Safety
  safety: {
    incidents: [{
      date: Date,
      description: String,
      severity: {
        type: String,
        enum: ['minor', 'moderate', 'major', 'critical']
      },
      injured: [{
        worker: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        injury: String
      }],
      resolved: {
        type: Boolean,
        default: false
      }
    }],
    lastInspection: Date,
    nextInspection: Date
  },
  
  // Notes
  notes: String,
  
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
projectSchema.index({ code: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ manager: 1 });
projectSchema.index({ startDate: -1 });
projectSchema.index({ 'team.worker': 1 });

// Virtual for duration
projectSchema.virtual('duration').get(function() {
  const end = this.actualEndDate || new Date();
  const diffTime = Math.abs(end - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days remaining
projectSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed') return 0;
  const today = new Date();
  const diffTime = this.expectedEndDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to update progress
projectSchema.methods.updateProgress = async function() {
  if (this.phases.length === 0) return this.progress;
  
  const totalProgress = this.phases.reduce((sum, phase) => sum + phase.progress, 0);
  this.progress = Math.round(totalProgress / this.phases.length);
  
  await this.save();
  return this.progress;
};

// Static method to get project statistics
projectSchema.statics.getStatistics = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget.estimated' },
        totalActual: { $sum: '$budget.actual' }
      }
    }
  ]);
};

module.exports = mongoose.model('Project', projectSchema);
