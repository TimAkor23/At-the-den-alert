const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['safe', 'help-needed', 'evacuated'],
    default: 'safe'
  },
  location: {
    name: {
      type: String,
      default: 'Unknown'
    },
    building: String,
    coordinates: [Number]
  },
  message: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('CheckIn', checkInSchema);