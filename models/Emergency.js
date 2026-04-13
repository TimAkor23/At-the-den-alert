const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['fire', 'medical', 'lockdown', 'weather', 'active-threat', 'test', 'other'],
    required: [true, 'Emergency type is required']
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'drill', 'false-alarm'],
    default: 'active'
  },
  severity: {
    type: String,  // ← CHANGED from Number to String
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },
  location: {
    name: {
      type: String,
      default: 'Unknown'
    },
    building: String,
    room: String,
    coordinates: {
      type: [Number],
      default: null
    }
  },
  description: {
    type: String,
    default: ''
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedByName: {
    type: String,  // ← ADD THIS - stores the user's name as string
    default: ''
  },
  images: [String],
  peopleAffected: {
    type: String,
    default: 'unknown'
  },
  immediateDanger: {
    type: Boolean,
    default: false
  },
  updates: [{
    message: String,
    author: {
      type: String,  // ← CHANGED from ObjectId to String
      default: 'System'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  userLocations: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    coordinates: [Number],
    timestamp: Date
  }],
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Emergency', emergencySchema);