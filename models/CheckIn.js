const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  location: {
    name: String,
    building: String,
    room: String,
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  status: {
    type: String,
    enum: ['safe', 'help-needed', 'evacuated'],
    default: 'safe'
  },
  message: {
    type: String,
    maxlength: 200
  },
  checkInType: {
    type: String,
    enum: ['manual', 'automatic', 'emergency'],
    default: 'manual'
  },
  emergencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emergency'
  }
}, { 
  timestamps: true 
});

// Index for quick queries
checkInSchema.index({ user: 1, createdAt: -1 });
checkInSchema.index({ emergencyId: 1, status: 1 });

module.exports = mongoose.model('CheckIn', checkInSchema);