const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [{
      type: { type: String, enum: ['image', 'video'] },
      url: String,
      analysis: String
    }]
  }],
  context: {
    activeEmergency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Emergency'
    },
    userLocation: {
      coordinates: [Number],
      building: String
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);