const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Şifrə ən azı 8 simvol olmalıdır'],
    select: false
  },
  
  // Profile
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[0-9\s-]{10,}$/, 'Please enter a valid phone number']
  },
  avatar: {
    type: String,
    default: null
  },
  
  // Role & Permissions (role = sistem və ya admin tərəfindən yaradılmış rol slug-u)
  role: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 40,
    match: [/^[a-z0-9_-]+$/, 'Yalnız kiçik latın, rəqəm, _ və -'],
    default: 'worker'
  },
  /** Giriş və frontend panelləri üçün: admin | seller (satıcı/kassa) | worker */
  roleLanding: {
    type: String,
    enum: ['admin', 'seller', 'worker'],
    default: 'worker'
  },
  permissions: [{
    type: String,
    enum: [
      'workers.view', 'workers.create', 'workers.edit', 'workers.delete',
      'attendance.view', 'attendance.manage',
      'salary.view', 'salary.manage',
      'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
      'projects.view', 'projects.manage',
      'reports.view', 'reports.create',
      'settings.view', 'settings.manage',
      'users.view', 'users.manage',
      'sales.view', 'sales.create', 'sales.edit',
      'materials.view', 'materials.manage',
      'permissions.view', 'permissions.manage',
      'cash.deposit'
    ]
  }],
  
  // Worker specific fields
  workerId: {
    type: String,
    unique: true,
    sparse: true
  },
  position: {
    type: String,
    trim: true,
    maxlength: 80,
    default: 'İşçi'
  },
  department: {
    type: String,
    trim: true,
    maxlength: 80,
    default: 'Ümumi'
  },
  
  // Salary Info
  dailySalary: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlySalary: {
    type: Number,
    default: 0,
    min: 0
  },
  workDaysPerMonth: {
    type: Number,
    default: 26,
    min: 1,
    max: 31
  },
  
  // Employment Info
  hireDate: {
    type: Date,
    default: Date.now
  },
  contractType: {
    type: String,
    enum: ['Tam ştat', 'Yarım ştat', 'Müqavilə', 'Müvəqqəti'],
    default: 'Tam ştat'
  },
  contractEndDate: {
    type: Date,
    default: null
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'terminated', 'on_leave'],
    default: 'active'
  },
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  
  // Address
  address: {
    street: String,
    city: String,
    region: String,
    zipCode: String
  },
  
  // ID Information
  idNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  fin: {
    type: String,
    unique: true,
    sparse: true,
    maxlength: 7
  },
  
  // Login tracking
  lastLogin: {
    type: Date,
    default: null
  },
  lastLoginIp: {
    type: String,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Number,
    default: null
  },
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Email verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  
  // Two-factor authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  
  // Push notification tokens
  pushTokens: [{
    token: String,
    device: String,
    platform: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'az',
      enum: ['az', 'en', 'ru', 'tr']
    },
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark', 'auto']
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  
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
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(doc, ret) {
      ret.id = ret._id != null ? String(ret._id) : ret.id;
      delete ret._id;
      delete ret.__v;
      if (ret.password != null) delete ret.password;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ roleLanding: 1 });
userSchema.index({ status: 1 });
userSchema.index({ workerId: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// API / frontend compatibility (older UI expects `name`)
userSchema.virtual('name').get(function() {
  const full = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  return full || this.username || '';
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(username, password) {
  const user = await this.findOne({ 
    $or: [{ username }, { email: username }],
    status: { $in: ['active', 'on_leave'] }
  }).select('+password');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  if (user.isLocked) {
    throw new Error('Account is locked. Please try again later.');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw new Error('Invalid credentials');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.updateOne({
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 }
    });
  }
  
  return user;
};

// Static method to get permissions for role
userSchema.statics.getDefaultPermissions = function(role) {
  const permissionsMap = {
    admin: ['workers.view', 'workers.create', 'workers.edit', 'workers.delete',
            'attendance.view', 'attendance.manage',
            'salary.view', 'salary.manage',
            'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
            'projects.view', 'projects.manage',
            'reports.view', 'reports.create',
            'settings.view', 'settings.manage',
            'users.view', 'users.manage'],
    manager: ['workers.view', 'workers.edit',
              'attendance.view', 'attendance.manage',
              'salary.view',
              'tasks.view', 'tasks.create', 'tasks.edit',
              'projects.view', 'projects.manage',
              'reports.view'],
    seller: ['cash.deposit', 'reports.view'],
    cashier: ['cash.deposit', 'reports.view'],
    worker: ['tasks.view', 'attendance.view', 'salary.view'],
    accountant: ['salary.view', 'salary.manage',
                 'reports.view', 'reports.create'],
    hr: ['workers.view', 'workers.create', 'workers.edit',
         'attendance.view', 'attendance.manage',
         'permissions.view', 'permissions.manage']
  };
  
  return permissionsMap[role] || [];
};

module.exports = mongoose.model('User', userSchema);
