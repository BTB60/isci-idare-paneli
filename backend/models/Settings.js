const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Company Info
  company: {
    name: {
      type: String,
      default: '555 Insaat'
    },
    legalName: String,
    taxId: String,
    registrationNumber: String,
    address: {
      street: String,
      city: String,
      region: String,
      zipCode: String,
      country: {
        type: String,
        default: 'Azerbaijan'
      }
    },
    contact: {
      phone: String,
      email: String,
      website: String
    },
    logo: String,
    bankDetails: {
      bankName: String,
      accountNumber: String,
      swiftCode: String
    }
  },
  
  // Working Hours
  workingHours: {
    standard: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '18:00'
      },
      lunchBreak: {
        start: {
          type: String,
          default: '13:00'
        },
        end: {
          type: String,
          default: '14:00'
        }
      }
    },
    workDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }],
    shifts: [{
      name: String,
      startTime: String,
      endTime: String,
      isNightShift: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  // Attendance Settings
  attendance: {
    gracePeriod: {
      type: Number,
      default: 15 // minutes
    },
    lateThreshold: {
      type: Number,
      default: 15 // minutes
    },
    earlyLeaveThreshold: {
      type: Number,
      default: 15 // minutes
    },
    overtimeThreshold: {
      type: Number,
      default: 30 // minutes
    },
    checkInMethods: [{
      type: String,
      enum: ['web', 'mobile', 'qr', 'biometric', 'manual']
    }],
    requirePhoto: {
      type: Boolean,
      default: false
    },
    requireLocation: {
      type: Boolean,
      default: false
    },
    allowedRadius: {
      type: Number,
      default: 100 // meters
    }
  },
  
  // Salary Settings
  salary: {
    currency: {
      type: String,
      default: 'AZN'
    },
    payDay: {
      type: Number,
      default: 25 // day of month
    },
    overtimeRate: {
      weekday: {
        type: Number,
        default: 1.5
      },
      weekend: {
        type: Number,
        default: 2.0
      },
      holiday: {
        type: Number,
        default: 2.5
      }
    },
    tax: {
      enabled: {
        type: Boolean,
        default: true
      },
      rate: {
        type: Number,
        default: 0 // percentage
      }
    },
    socialSecurity: {
      enabled: {
        type: Boolean,
        default: true
      },
      employeeRate: {
        type: Number,
        default: 3 // percentage
      },
      employerRate: {
        type: Number,
        default: 22 // percentage
      }
    }
  },
  
  // Leave Settings
  leave: {
    annual: {
      daysPerYear: {
        type: Number,
        default: 21
      },
      minDaysPerRequest: {
        type: Number,
        default: 1
      },
      maxDaysPerRequest: {
        type: Number,
        default: 15
      }
    },
    sick: {
      daysPerYear: {
        type: Number,
        default: 14
      },
      requiresCertificate: {
        type: Boolean,
        default: true
      }
    },
    unpaid: {
      maxDaysPerYear: {
        type: Number,
        default: 30
      }
    },
    carryOver: {
      enabled: {
        type: Boolean,
        default: false
      },
      maxDays: {
        type: Number,
        default: 5
      }
    }
  },
  
  // Notification Settings
  notifications: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      fromName: {
        type: String,
        default: '555 Insaat'
      },
      fromEmail: String
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      }
    },
    push: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    events: {
      attendance: {
        type: Boolean,
        default: true
      },
      salary: {
        type: Boolean,
        default: true
      },
      tasks: {
        type: Boolean,
        default: true
      },
      permissions: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Security Settings
  security: {
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8
      },
      requireUppercase: {
        type: Boolean,
        default: true
      },
      requireLowercase: {
        type: Boolean,
        default: true
      },
      requireNumbers: {
        type: Boolean,
        default: true
      },
      requireSpecialChars: {
        type: Boolean,
        default: false
      },
      expiryDays: {
        type: Number,
        default: 90
      }
    },
    sessionTimeout: {
      type: Number,
      default: 30 // minutes
    },
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    lockoutDuration: {
      type: Number,
      default: 30 // minutes
    },
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false
      },
      requiredForRoles: [{
        type: String,
        enum: ['admin', 'manager', 'accountant', 'hr']
      }]
    }
  },
  
  // System Settings
  system: {
    timezone: {
      type: String,
      default: 'Asia/Baku'
    },
    dateFormat: {
      type: String,
      default: 'DD.MM.YYYY'
    },
    timeFormat: {
      type: String,
      default: '24h'
    },
    language: {
      type: String,
      default: 'az',
      enum: ['az', 'en', 'ru', 'tr']
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    }
  },
  
  // Backup Settings
  backup: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    time: {
      type: String,
      default: '02:00'
    },
    retention: {
      type: Number,
      default: 30 // days
    }
  },
  
  // Custom fields
  customFields: [{
    entity: {
      type: String,
      enum: ['User', 'Project', 'Task', 'Sale']
    },
    name: String,
    label: String,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'select', 'checkbox']
    },
    required: {
      type: Boolean,
      default: false
    },
    options: [String] // for select type
  }],
  
  // Metadata
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Static method to get settings
settingsSchema.statics.get = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Static method to update settings
settingsSchema.statics.update = async function(data, userId) {
  let settings = await this.findOne();
  
  if (!settings) {
    settings = new this(data);
  } else {
    Object.assign(settings, data);
  }
  
  settings.updatedBy = userId;
  settings.updatedAt = new Date();
  
  await settings.save();
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
