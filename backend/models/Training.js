const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, 'Training title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  
  // Category
  category: {
    type: String,
    enum: [
      'safety', 'technical', 'management', 'soft_skills',
      'certification', 'compliance', 'equipment', 'other'
    ],
    default: 'other'
  },
  
  // Type
  type: {
    type: String,
    enum: ['online', 'in_person', 'hybrid', 'on_the_job'],
    default: 'in_person'
  },
  
  // Provider
  provider: {
    name: String,
    contact: String,
    email: String,
    website: String,
    isExternal: {
      type: Boolean,
      default: false
    }
  },
  
  // Instructor
  instructor: {
    name: String,
    email: String,
    phone: String,
    credentials: String
  },
  
  // Schedule
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    hours: {
      type: Number,
      default: 0
    },
    days: {
      type: Number,
      default: 0
    }
  },
  
  // Location (for in-person training)
  location: {
    address: String,
    city: String,
    room: String,
    onlineLink: String
  },
  
  // Capacity
  maxParticipants: {
    type: Number,
    default: 20
  },
  
  // Cost
  cost: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'AZN'
    },
    perPerson: {
      type: Boolean,
      default: true
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'],
    default: 'draft'
  },
  
  // Participants
  participants: [{
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['registered', 'attending', 'completed', 'dropped', 'no_show'],
      default: 'registered'
    },
    attendance: {
      sessionsAttended: { type: Number, default: 0 },
      totalSessions: { type: Number, default: 0 },
      attendancePercentage: { type: Number, default: 0 }
    },
    score: {
      type: Number,
      default: null,
      min: 0,
      max: 100
    },
    result: {
      type: String,
      enum: ['pass', 'fail', 'incomplete', null],
      default: null
    },
    certificate: {
      issued: { type: Boolean, default: false },
      number: String,
      url: String,
      issuedAt: Date,
      expiryDate: Date
    },
    feedback: String,
    registeredAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date
  }],
  
  // Curriculum/Modules
  modules: [{
    title: String,
    description: String,
    duration: Number, // in minutes
    order: Number
  }],
  
  // Materials
  materials: [{
    title: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'presentation', 'link', 'document', 'other']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Prerequisites
  prerequisites: [{
    type: String
  }],
  
  // Certification
  certification: {
    offered: {
      type: Boolean,
      default: false
    },
    name: String,
    validityPeriod: Number, // in months
    requiresRenewal: {
      type: Boolean,
      default: false
    }
  },
  
  // Evaluation
  evaluation: {
    required: {
      type: Boolean,
      default: true
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    quiz: [{
      question: String,
      options: [String],
      correctAnswer: Number
    }]
  },
  
  // Feedback
  feedback: [{
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
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
trainingSchema.index({ category: 1 });
trainingSchema.index({ status: 1 });
trainingSchema.index({ startDate: 1 });
trainingSchema.index({ 'participants.worker': 1 });
trainingSchema.index({ 'certification.offered': 1 });

// Virtual for available spots
trainingSchema.virtual('availableSpots').get(function() {
  const registered = this.participants.filter(p => 
    ['registered', 'attending', 'completed'].includes(p.status)
  ).length;
  return Math.max(0, this.maxParticipants - registered);
});

// Virtual for isFull
trainingSchema.virtual('isFull').get(function() {
  return this.availableSpots === 0;
});

// Virtual for average rating
trainingSchema.virtual('averageRating').get(function() {
  if (this.feedback.length === 0) return 0;
  const sum = this.feedback.reduce((acc, f) => acc + f.rating, 0);
  return (sum / this.feedback.length).toFixed(1);
});

// Method to register participant
trainingSchema.methods.registerParticipant = async function(workerId) {
  if (this.isFull) {
    throw new Error('Training is full');
  }
  
  const alreadyRegistered = this.participants.some(
    p => p.worker.toString() === workerId.toString()
  );
  
  if (alreadyRegistered) {
    throw new Error('Worker already registered');
  }
  
  this.participants.push({
    worker: workerId,
    status: 'registered'
  });
  
  await this.save();
  return this;
};

// Method to update participant status
trainingSchema.methods.updateParticipantStatus = async function(workerId, status, data = {}) {
  const participant = this.participants.find(
    p => p.worker.toString() === workerId.toString()
  );
  
  if (!participant) {
    throw new Error('Participant not found');
  }
  
  participant.status = status;
  
  if (status === 'completed') {
    participant.completedAt = new Date();
    
    // Check if passed evaluation
    if (this.evaluation.required && data.score >= this.evaluation.passingScore) {
      participant.result = 'pass';
      
      // Issue certificate if offered
      if (this.certification.offered) {
        participant.certificate.issued = true;
        participant.certificate.number = `CERT-${Date.now()}`;
        participant.certificate.issuedAt = new Date();
        
        if (this.certification.validityPeriod) {
          const expiry = new Date();
          expiry.setMonth(expiry.getMonth() + this.certification.validityPeriod);
          participant.certificate.expiryDate = expiry;
        }
      }
    } else if (this.evaluation.required) {
      participant.result = 'fail';
    }
    
    if (data.score !== undefined) {
      participant.score = data.score;
    }
  }
  
  await this.save();
  return this;
};

// Static method to get upcoming trainings
trainingSchema.statics.getUpcoming = async function(days = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  return this.find({
    startDate: { $gte: startDate, $lte: endDate },
    status: { $in: ['scheduled', 'in_progress'] }
  }).populate('participants.worker', 'firstName lastName');
};

// Static method to get worker's trainings
trainingSchema.statics.getWorkerTrainings = async function(workerId, status) {
  const query = { 'participants.worker': workerId };
  if (status) {
    query['participants.status'] = status;
  }
  
  return this.find(query).sort({ startDate: -1 });
};

module.exports = mongoose.model('Training', trainingSchema);
