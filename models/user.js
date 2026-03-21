const mongoose = require('mongoose');

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
    lowercase: true
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
  lastCheckIn: Date,
  lastLocation: {
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  }
}, { timestamps: true });

// NO PRE-SAVE HOOK - we'll hash in the controller instead

module.exports = mongoose.model('User', userSchema);