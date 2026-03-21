const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
    validate: {
      validator: function(coords) {
        return coords.length === 2 && 
               coords[0] >= -180 && coords[0] <= 180 && 
               coords[1] >= -90 && coords[1] <= 90;
      },
      message: 'Invalid coordinates'
    }
  },
  accuracy: {
    type: Number,
    default: null
  },
  location: {
    name: String,
    building: String,
    room: String,
    address: String
  },
  shareWith: {
    type: String,
    enum: ['authorities', 'contacts', 'public', 'none'],
    default: 'authorities'
  },
  emergencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emergency'
  },
  isEmergencyLocation: {
    type: Boolean,
    default: false
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  deviceInfo: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Create geospatial index for location queries
locationSchema.index({ coordinates: '2dsphere' });
locationSchema.index({ user: 1, timestamp: -1 });
locationSchema.index({ emergencyId: 1, timestamp: -1 });

module.exports = mongoose.model('Location', locationSchema);