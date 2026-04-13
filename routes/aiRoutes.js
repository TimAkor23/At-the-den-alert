const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt that allows general questions but emphasizes emergency expertise
const SYSTEM_PROMPT = `You are "At the Den AI" - a helpful assistant for Lincoln University students.
You can answer ANY question the user asks - nothing is off limits!

However, you have SPECIAL EXPERTISE in:
- Emergency procedures (fire, lockdown, medical, weather, active threats)
- Safety protocols on campus
- First aid instructions
- Evacuation procedures
- Campus safety resources
- What to do during various crisis situations

For emergency-related questions, give detailed, actionable safety advice.
For general questions (homework help, fun facts, personal advice, etc.), answer normally and helpfully.
Be friendly, conversational, and engaging - like a knowledgeable friend.

If someone is in immediate danger, always advise them to call 911 and campus security at 484-365-7211.`;

// AI Chat endpoint (supports text and images)
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, image } = req.body;
    
    if (!message && !image) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide a message or image' 
      });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    let result;
    
    // If image is provided
    if (image && image.startsWith('data:image')) {
      // Extract base64 data
      const base64Data = image.split(',')[1];
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      };
      
      const prompt = `${SYSTEM_PROMPT}\n\nUser asked: ${message || 'What is in this image?'}\n\nProvide a helpful response. If the image shows something emergency-related, explain it. Otherwise, just describe what you see and answer any questions.`;
      
      result = await model.generateContent([prompt, imagePart]);
    } else {
      // Text-only chat - ANY question is allowed!
      const prompt = `${SYSTEM_PROMPT}\n\nUser: ${message}\n\nAssistant:`;
      result = await model.generateContent(prompt);
    }
    
    const response = await result.response;
    const text = response.text();
    
    res.json({ 
      success: true, 
      response: text,
      message: 'AI response generated'
    });
    
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI service error',
      response: "I'm having trouble connecting right now. Please try again in a moment. If this is an emergency, call campus security at 484-365-7211."
    });
  }
});

// Quick emergency tips endpoint (public)
router.get('/emergency-tips/:type', async (req, res) => {
  const { type } = req.params;
  
  const tips = {
    fire: "🔥 FIRE EMERGENCY:\n1) Pull the nearest alarm\n2) Evacuate immediately\n3) Don't use elevators\n4) Assemble at the football field\n5) Call 911 then campus security",
    lockdown: "🔒 LOCKDOWN PROCEDURE:\n1) Lock all doors/windows\n2) Turn off lights\n3) Move out of sight\n4) Silence phones\n5) Wait for official all-clear",
    medical: "🏥 MEDICAL EMERGENCY:\n1) Call 911\n2) Contact campus nurse at ext. 555\n3) Don't move the person unless in danger\n4) Apply pressure to bleeding\n5) Stay with them until help arrives",
    weather: "🌩️ SEVERE WEATHER:\n1) Move to interior room\n2) Stay away from windows\n3) Don't use electronics\n4) Wait for official all-clear\n5) Check emergency alerts"
  };
  
  res.json({ 
    success: true, 
    data: tips[type] || "Follow official emergency protocols and await further instructions."
  });
});

module.exports = router;