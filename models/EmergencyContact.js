const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // Only required for personal contacts, not public ones
      return !this.isPublic;
    }
  },
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true
  },
  relationship: {
    type: String,
    enum: ['parent', 'guardian', 'spouse', 'sibling', 'friend', 'doctor', 'other'],
    default: 'other'
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  secondaryPhone: String,
  email: String,
  address: String,
  isPrimary: {
    type: Boolean,
    default: false
  },
  notifyOnEmergency: {
    type: Boolean,
    default: true
  },
  notes: String,
  isPublic: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['personal', 'campus-security', 'medical', 'public-safety', 'student-safety', 'facilities'],
    default: 'personal'
  },
  organization: String,
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, { timestamps: true });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);