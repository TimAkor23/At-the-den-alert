const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    default: 'student'
  },
  safeStatus: {
    type: Boolean,
    default: true
  },
  lastCheckIn: {
    type: Date,
    default: null
  },
  lastLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  lastLocationUpdate: {
    type: Date,
    default: null
  },
  locationSharing: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Index for geospatial queries
userSchema.index({ lastLocation: '2dsphere' });

// Compare password method (for login)
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// NO PRE-SAVE HOOK - Password hashing is done in authController

module.exports = mongoose.model('User', userSchema);