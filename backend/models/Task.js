const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  
  // Project reference
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Task details
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'review', 'completed', 'cancelled', 'on_hold'],
    default: 'pending'
  },
  
  // Category/Type
  category: {
    type: String,
    enum: ['construction', 'electrical', 'plumbing', 'painting', 'finishing', 'inspection', 'maintenance', 'other'],
    default: 'other'
  },
  
  // Timeline
  startDate: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  
  // Estimated vs Actual
  estimatedHours: {
    type: Number,
    default: 0,
    min: 0
  },
  actualHours: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Progress
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Checklist/Subtasks
  subtasks: [{
    title: String,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  
  // Dependencies
  dependencies: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    type: {
      type: String,
      enum: ['blocks', 'relates_to', 'duplicates'],
      default: 'blocks'
    }
  }],
  
  // Comments/Updates
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    attachments: [String]
  }],
  
  // Time tracking
  timeLogs: [{
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    description: String,
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Location (for field tasks)
  location: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    radius: { // Allowed check-in radius in meters
      type: Number,
      default: 100
    }
  },
  
  // Quality check
  qualityCheck: {
    required: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'waived'],
      default: 'pending'
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedAt: Date,
    notes: String
  },
  
  // Recurring task
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    interval: Number,
    endDate: Date
  },
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'all']
    },
    beforeMinutes: Number,
    sent: {
      type: Boolean,
      default: false
    }
  }],
  
  // Tags
  tags: [String],
  
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
taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ category: 1 });

// Pre-save middleware
taskSchema.pre('save', function(next) {
  // Update completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    this.progress = 100;
  }
  
  // Calculate actual hours from time logs
  if (this.timeLogs && this.timeLogs.length > 0) {
    this.actualHours = this.timeLogs.reduce((total, log) => {
      return total + (log.duration / 60);
    }, 0);
  }
  
  // Calculate progress from subtasks
  if (this.subtasks && this.subtasks.length > 0) {
    const completedSubtasks = this.subtasks.filter(st => st.completed).length;
    this.progress = Math.round((completedSubtasks / this.subtasks.length) * 100);
    
    // Auto-update status based on progress
    if (this.progress === 100 && this.status !== 'completed') {
      this.status = 'completed';
      this.completedAt = new Date();
    } else if (this.progress > 0 && this.progress < 100 && this.status === 'pending') {
      this.status = 'in_progress';
    }
  }
  
  next();
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') return false;
  return new Date() > this.dueDate;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (this.status === 'completed') return 0;
  const diffTime = this.dueDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to add time log
taskSchema.methods.addTimeLog = async function(startTime, endTime, description, loggedBy) {
  const duration = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60));
  
  this.timeLogs.push({
    startTime,
    endTime,
    duration,
    description,
    loggedBy
  });
  
  await this.save();
  return this;
};

// Static method to get task statistics
taskSchema.statics.getStatistics = async function(userId, projectId) {
  const matchStage = {};
  if (userId) matchStage.assignedTo = new mongoose.Types.ObjectId(userId);
  if (projectId) matchStage.project = new mongoose.Types.ObjectId(projectId);
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalEstimatedHours: { $sum: '$estimatedHours' },
        totalActualHours: { $sum: '$actualHours' }
      }
    }
  ]);
};

// Static method to get overdue tasks
taskSchema.statics.getOverdueTasks = async function(userId) {
  const query = {
    status: { $nin: ['completed', 'cancelled'] },
    dueDate: { $lt: new Date() }
  };
  
  if (userId) {
    query.assignedTo = userId;
  }
  
  return this.find(query)
    .populate('assignedTo', 'firstName lastName')
    .populate('project', 'name')
    .sort({ dueDate: 1 });
};

module.exports = mongoose.model('Task', taskSchema);
