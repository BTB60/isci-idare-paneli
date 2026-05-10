const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      'create', 'update', 'delete', 'view', 'login', 'logout',
      'export', 'import', 'approve', 'reject', 'cancel',
      'assign', 'unassign', 'complete', 'verify'
    ]
  },
  
  // Entity details
  entity: {
    type: {
      type: String,
      required: true,
      enum: [
        'User', 'Attendance', 'Salary', 'Project', 'Task',
        'Permission', 'ShiftChange', 'Penalty', 'Bonus',
        'Advance', 'Overtime', 'Sale', 'Material', 'Document',
        'Training', 'Notification', 'Setting'
      ]
    },
    id: mongoose.Schema.Types.ObjectId,
    name: String
  },
  
  // User who performed the action
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByName: String, // Denormalized for quick access
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Changes (for create/update)
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    diff: mongoose.Schema.Types.Mixed
  },
  
  // Request details
  request: {
    ip: String,
    userAgent: String,
    method: String,
    url: String,
    body: mongoose.Schema.Types.Mixed,
    params: mongoose.Schema.Types.Mixed,
    query: mongoose.Schema.Types.Mixed
  },
  
  // Response details
  response: {
    statusCode: Number,
    success: Boolean,
    message: String
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Severity
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  }
}, {
  timestamps: true
});

// Indexes
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ 'entity.type': 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ 'entity.id': 1 });

// TTL index to auto-delete old logs (keep for 1 year)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Static method to log an action
auditLogSchema.statics.log = async function(data) {
  return this.create(data);
};

// Static method to get recent activity
auditLogSchema.statics.getRecent = async function(limit = 50, filters = {}) {
  const query = {};
  
  if (filters.userId) query.performedBy = filters.userId;
  if (filters.entityType) query['entity.type'] = filters.entityType;
  if (filters.action) query.action = filters.action;
  if (filters.severity) query.severity = filters.severity;
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('performedBy', 'firstName lastName username');
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function(userId, startDate, endDate) {
  const query = { performedBy: userId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
