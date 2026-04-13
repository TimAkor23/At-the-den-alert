const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  handleChat,
  safetyAssistant,
  analyzeMedia,
  getProtocolSummary,
  naturalLanguageQuery
} = require('../controllers/aiChatController');

// All AI routes require authentication
router.use(protect);

// Main chat endpoint
router.post('/chat', handleChat);

// Safety assistant (specialized for emergencies)
router.post('/safety-assistant', safetyAssistant);

// Image/Video analysis
router.post('/analyze', analyzeMedia);

// Get protocol summary
router.get('/protocol/:protocolType', getProtocolSummary);

// Natural language queries
router.post('/query', naturalLanguageQuery);

module.exports = router;