const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function(coords) {
        return coords && coords.length === 2;
      },
      message: 'Coordinates must be [longitude, latitude]'
    }
  },
  building: {
    type: String,
    default: 'Unknown'
  },
  shareWith: {
    type: String,
    enum: ['authorities', 'contacts', 'public'],
    default: 'authorities'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);