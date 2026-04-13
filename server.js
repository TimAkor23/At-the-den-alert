const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

require('dotenv').config();

// Import database connection
const connectDB = require('./config/db');

// Connect to database
connectDB();

// Initialize Gemini AI
let genAI;
console.log('🔍 Checking Gemini AI setup...');

if (process.env.GEMINI_API_KEY) {
  console.log('✅ GEMINI_API_KEY found');
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✅ Gemini AI initialized successfully!');
  } catch (error) {
    console.log('❌ Gemini AI init failed:', error.message);
    genAI = null;
  }
} else {
  console.log('❌ GEMINI_API_KEY not found in .env file');
  genAI = null;
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// ROUTES
// ============================================

// Auth Routes
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (err) {
  console.log('❌ Auth routes error:', err.message);
}

// Emergency Routes
try {
  const emergencyRoutes = require('./routes/emergencyRoutes');
  app.use('/api/emergency', emergencyRoutes);
  console.log('✅ Emergency routes loaded');
} catch (err) {
  console.log('❌ Emergency routes error:', err.message);
}

// ============================================
// AI CHAT ENDPOINT - CONCISE RESPONSES
// ============================================
app.post('/api/ai/chat', async (req, res) => {
  console.log('\n🔵 ========== AI CHAT REQUEST RECEIVED ==========');
  console.log('📨 Message:', req.body.message?.substring(0, 100) || '(empty)');
  console.log('📨 Has image:', !!req.body.image);
  
  const { message, image } = req.body;
  
  if (!message && !image) {
    return res.status(400).json({ 
      success: false, 
      response: "Please ask me a question!" 
    });
  }
  
  if (!genAI) {
    console.log('❌ Gemini NOT available');
    return res.json({ 
      success: false, 
      response: "⚠️ AI service is not configured.",
      error: "Gemini not initialized"
    });
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const systemPrompt = `You are a helpful assistant for Lincoln University students.
    
RULES:
- Keep responses SHORT (2-3 sentences max)
- Get straight to the point - no fluff
- For factual questions, give just the answer
- For emergency questions, give only essential steps
- Be direct and helpful

Examples:
Q: "How many bones in human body?" A: "206 bones."
Q: "What to do during fire?" A: "Pull alarm, evacuate, stay low, assemble at football field."

Now answer concisely:`;
    
    let result;
    
    if (image && image.startsWith('data:image')) {
      console.log('🖼️ Processing image...');
      const base64Data = image.split(',')[1];
      let mimeType = 'image/jpeg';
      if (image.includes('data:image/png')) mimeType = 'image/png';
      if (image.includes('data:image/gif')) mimeType = 'image/gif';
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
      
      const prompt = `${systemPrompt}\n\nUser asked: ${message || "What's in this image?"}\n\nConcise answer:`;
      result = await model.generateContent([prompt, imagePart]);
    } else {
      const prompt = `${systemPrompt}\n\nUser: ${message}\n\nConcise answer:`;
      result = await model.generateContent(prompt);
    }
    
    const response = await result.response;
    let text = response.text().trim();
    
    // Remove common fluff phrases
    text = text.replace(/^(Here's|Sure|Of course|Absolutely|Certainly)[:,]\s*/i, '');
    
    console.log('✅ Response:', text);
    console.log('🔵 ========== REQUEST COMPLETE ==========\n');
    
    res.json({ 
      success: true, 
      response: text
    });
    
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    console.log('🔵 ========== REQUEST FAILED ==========\n');
    
    res.json({ 
      success: false, 
      response: `Error: ${error.message}`,
      error: error.message
    });
  }
});

// ============================================
// TEST GEMINI ENDPOINT
// ============================================
app.get('/api/test-gemini', async (req, res) => {
  try {
    if (!genAI) {
      return res.json({ 
        success: false, 
        error: 'Gemini not initialized'
      });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say 'Gemini is working!'");
    const response = result.response.text();
    
    res.json({ 
      success: true, 
      message: response,
      gemini_status: 'enabled'
    });
    
  } catch (error) {
    console.error('Test error:', error.message);
    res.json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    gemini: genAI ? 'configured' : 'not configured'
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🤖 Gemini AI: ${genAI ? '✅ ENABLED' : '⚠️ DISABLED'}`);
  console.log(`✅ Model: gemini-2.5-flash (concise responses)`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /health                 - Health check`);
  console.log(`   GET  /api/test-gemini        - Test Gemini AI`);
  console.log(`   POST /api/ai/chat            - AI chat (concise responses)`);
  console.log(`   POST /api/emergency/report   - Report emergency`);
  console.log(`   POST /api/emergency/checkin  - Check-in safe`);
  console.log(`   POST /api/emergency/location - Share location`);
  console.log(`   GET  /api/emergency/contacts - Get contacts`);
  console.log(`   GET  /api/emergency/active   - Active emergencies`);
  console.log('');
});