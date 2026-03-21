const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['fire', 'lockdown', 'medical', 'weather', 'active-threat', 'other'],
    required: [true, 'Emergency type is required']
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'drill', 'false-alarm'],
    default: 'active'
  },
  severity: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  location: {
    name: {
      type: String,
      required: [true, 'Location name is required']
    },
    building: String,
    room: String,
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedByName: String,
  peopleAffected: {
    type: String,
    enum: ['1', '2-5', '6-10', '11-20', '20+', 'unknown'],
    default: 'unknown'
  },
  immediateDanger: {
    type: Boolean,
    default: false
  },
  images: [String],
  updates: [{
    message: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    authorName: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true 
});

// Index for querying active emergencies
emergencySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Emergency', emergencySchema);