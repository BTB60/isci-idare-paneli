const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notification content
  title: {
    type: String,
    required: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  
  // Type and category
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  category: {
    type: String,
    enum: [
      'attendance', 'salary', 'task', 'project', 'permission',
      'shift_change', 'penalty', 'bonus', 'system', 'general'
    ],
    default: 'general'
  },
  
  // Related entity
  relatedTo: {
    model: {
      type: String,
      enum: ['User', 'Task', 'Project', 'Attendance', 'Salary', 'Permission', 'ShiftChange']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  
  // Action link
  actionLink: String,
  actionText: String,
  
  // Delivery channels
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  
  // Delivery status
  deliveryStatus: {
    inApp: {
      sent: { type: Boolean, default: true },
      sentAt: { type: Date, default: Date.now }
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    }
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  
  // Click tracking
  clicked: {
    type: Boolean,
    default: false
  },
  clickedAt: Date,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Expiration
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Scheduled sending
  scheduledFor: {
    type: Date,
    default: null
  },
  
  // Batch/Send group
  batchId: String,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });

// Pre-save middleware to set expiration for non-urgent notifications
notificationSchema.pre('save', function(next) {
  if (!this.expiresAt && this.priority !== 'urgent') {
    // Default expiration: 30 days
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Method to mark as clicked
notificationSchema.methods.markAsClicked = async function() {
  if (!this.clicked) {
    this.clicked = true;
    this.clickedAt = new Date();
    await this.save();
  }
  return this;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to get recent notifications
notificationSchema.statics.getRecent = async function(userId, limit = 20) {
  return this.find({
    recipient: userId,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to create and send notification
notificationSchema.statics.createAndSend = async function(data, io) {
  const notification = await this.create(data);
  
  // Emit to specific user via Socket.IO
  if (io) {
    io.to(`user_${data.recipient}`).emit('notification', {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      category: notification.category,
      createdAt: notification.createdAt
    });
  }
  
  return notification;
};

module.exports = mongoose.model('Notification', notificationSchema);
