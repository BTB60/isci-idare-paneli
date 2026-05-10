const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  // Document info
  name: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // File details
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  
  // Document type
  type: {
    type: String,
    enum: [
      'identity', 'passport', 'diploma', 'certificate', 'contract',
      'permit', 'license', 'medical', 'insurance', 'resume',
      'photo', 'blueprint', 'invoice', 'report', 'other'
    ],
    default: 'other'
  },
  
  // Category
  category: {
    type: String,
    enum: ['personal', 'work', 'project', 'financial', 'legal', 'other'],
    default: 'other'
  },
  
  // Owner
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Related entity
  relatedTo: {
    model: {
      type: String,
      enum: ['User', 'Project', 'Task', 'Salary', 'Attendance']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  
  // Document number/ID (for official documents)
  documentNumber: String,
  issueDate: Date,
  expiryDate: Date,
  issuingAuthority: String,
  
  // Verification
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  verificationNotes: String,
  
  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked', 'pending_verification'],
    default: 'active'
  },
  
  // Access control
  access: {
    public: {
      type: Boolean,
      default: false
    },
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    allowedRoles: [{
      type: String,
      enum: ['admin', 'manager', 'hr', 'accountant']
    }]
  },
  
  // Version control
  version: {
    type: Number,
    default: 1
  },
  parentDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  previousVersions: [{
    version: Number,
    url: String,
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
documentSchema.index({ owner: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ expiryDate: 1 });
documentSchema.index({ 'relatedTo.model': 1, 'relatedTo.id': 1 });

// Pre-save middleware to check expiry
documentSchema.pre('save', function(next) {
  if (this.expiryDate && this.expiryDate < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// Virtual for isExpired
documentSchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});

// Virtual for days until expiry
documentSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const diffTime = this.expiryDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to verify document
documentSchema.methods.verify = async function(verifiedBy, notes) {
  this.verified = true;
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
  this.status = 'active';
  await this.save();
  return this;
};

// Method to create new version
documentSchema.methods.createNewVersion = async function(newFileData, updatedBy) {
  // Save current version to history
  this.previousVersions.push({
    version: this.version,
    url: this.url,
    updatedAt: this.updatedAt,
    updatedBy: this.updatedBy
  });
  
  // Update with new file data
  this.version += 1;
  this.fileName = newFileData.fileName;
  this.originalName = newFileData.originalName;
  this.mimeType = newFileData.mimeType;
  this.size = newFileData.size;
  this.url = newFileData.url;
  this.path = newFileData.path;
  this.updatedBy = updatedBy;
  this.verified = false;
  this.status = 'pending_verification';
  
  await this.save();
  return this;
};

// Static method to get expiring documents
documentSchema.statics.getExpiringDocuments = async function(days = 30) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return this.find({
    expiryDate: {
      $gte: new Date(),
      $lte: expiryDate
    },
    status: 'active'
  }).populate('owner', 'firstName lastName email');
};

// Static method to get documents by owner
documentSchema.statics.getByOwner = async function(ownerId, options = {}) {
  const query = { owner: ownerId };
  
  if (options.type) query.type = options.type;
  if (options.category) query.category = options.category;
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

module.exports = mongoose.model('Document', documentSchema);
