const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    enum: ['info', 'warning', 'emergency'],
    default: 'info'
  },
  author: {
    type: String,
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'staff', 'admins'],
    default: 'all'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiry: 24 hours from creation
      const date = new Date();
      date.setHours(date.getHours() + 24);
      return date;
    }
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Index for efficient queries
broadcastSchema.index({ createdAt: -1 });
broadcastSchema.index({ isActive: 1, expiresAt: 1 });

module.exports = mongoose.model('Broadcast', broadcastSchema);