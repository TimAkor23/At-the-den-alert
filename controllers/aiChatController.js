const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatHistory = require('../models/ChatHistory');
const Emergency = require('../models/Emergency');
const fs = require('fs');
const path = require('path');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Load knowledge base (create this file next)
let emergencyProtocols = {};
try {
  const protocolsPath = path.join(__dirname, '../knowledge-base/emergency-protocols.json');
  emergencyProtocols = JSON.parse(fs.readFileSync(protocolsPath, 'utf8'));
} catch (error) {
  console.log('⚠️ No protocols file found, using defaults');
  emergencyProtocols = {
    fire: { name: "Fire Emergency", steps: ["Activate alarm", "Evacuate", "Call 911"] },
    lockdown: { name: "Lockdown", steps: ["Lock doors", "Stay quiet", "Wait for all-clear"] },
    medical: { name: "Medical Emergency", steps: ["Call 911", "Provide first aid", "Stay calm"] }
  };
}

// @desc    Handle chat messages
// @route   POST /api/ai/chat
// @access  Private
exports.handleChat = async (req, res) => {
  try {
    console.log('🤖 AI Chat function started');
    
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get or create chat session
    let chatSession = await ChatHistory.findOne({ user: userId, sessionId });
    if (!chatSession) {
      chatSession = await ChatHistory.create({
        user: userId,
        sessionId: sessionId || Date.now().toString(),
        messages: [],
        context: {}
      });
    }

    // Check for active emergency
    const activeEmergency = await Emergency.findOne({ status: 'active' });

    // Build context prompt
    const contextPrompt = `
You are an emergency safety assistant for Lincoln University. Your role is to:
- Provide real-time guidance during emergencies
- Answer questions about safety protocols
- Never give medical advice (always direct to professionals)
- Be calm, clear, and authoritative

${activeEmergency ? `⚠️ CURRENT ACTIVE EMERGENCY: ${activeEmergency.type.toUpperCase()} at ${activeEmergency.location.name}. Follow official protocols immediately.` : 'No active emergencies currently.'}

EMERGENCY PROTOCOLS:
${JSON.stringify(emergencyProtocols, null, 2)}

PREVIOUS CONVERSATION:
${chatSession.messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}

USER QUERY: ${message}

Respond helpfully but safely. If this is a real emergency, remind to use the Report Emergency button.
    `;

    let aiResponse;
    
    // Check if Gemini API key is configured
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_google_gemini_api_key_here') {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(contextPrompt);
        aiResponse = result.response.text();
      } catch (apiError) {
        console.error('Gemini API error:', apiError);
        aiResponse = getFallbackResponse(message, activeEmergency);
      }
    } else {
      // Fallback responses when no API key
      aiResponse = getFallbackResponse(message, activeEmergency);
    }

    // Save to history
    chatSession.messages.push(
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: aiResponse, timestamp: new Date() }
    );

    if (activeEmergency) {
      chatSession.context.activeEmergency = activeEmergency._id;
    }

    await chatSession.save();

    res.json({
      success: true,
      data: {
        message: aiResponse,
        sessionId: chatSession.sessionId,
        hasActiveEmergency: !!activeEmergency
      }
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Analyze image for safety threats
// @route   POST /api/ai/analyze
// @access  Private
exports.analyzeImage = async (req, res) => {
  try {
    console.log('📸 Image analysis function started');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image uploaded'
      });
    }

    const { question } = req.body;

    // Convert image to base64
    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString('base64');

    let analysis = '';
    let hasEmergency = false;

    // Check if Gemini API key is configured
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_google_gemini_api_key_here') {
      try {
        const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });

        const prompt = `
You are analyzing an image from a campus emergency situation.

USER QUESTION: ${question || 'Analyze this image for any safety concerns or emergencies.'}

Analyze the image and provide:
1. What you see (be specific)
2. Any potential dangers or emergencies detected
3. Recommended actions based on campus safety protocols

IMPORTANT:
- If you see fire, smoke, weapons, injuries, or other emergencies - state this clearly
- If the image shows normal campus activity, reassure the user
- Never diagnose injuries - always direct to medical professionals
- Be concise but thorough
        `;

        const result = await visionModel.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: req.file.mimetype
            }
          }
        ]);

        analysis = result.response.text();
        
        // Check for emergency keywords
        const emergencyKeywords = ['fire', 'smoke', 'weapon', 'gun', 'injured', 'unconscious', 'fight', 'danger'];
        hasEmergency = emergencyKeywords.some(keyword =>
          analysis.toLowerCase().includes(keyword)
        );
        
      } catch (apiError) {
        console.error('Vision API error:', apiError);
        analysis = "I couldn't analyze the image due to a technical issue. Please report any visible emergencies immediately using the Report Emergency button.";
        hasEmergency = false;
      }
    } else {
      // Fallback when no API key
      analysis = "📸 **Image Analysis (Demo Mode)**\n\nI'm currently running in demo mode without AI vision. For full image analysis, please add your Gemini API key to the .env file.\n\n**What to do:** If you see an emergency in this image, please use the Report Emergency button immediately.";
      hasEmergency = false;
    }

    res.json({
      success: true,
      data: {
        analysis: analysis,
        emergencyDetected: hasEmergency,
        recommendation: hasEmergency ?
          '⚠️ POTENTIAL EMERGENCY DETECTED! Use the Report Emergency button immediately.' :
          'If you see any danger, please report it using the Report Emergency button.'
      }
    });

  } catch (error) {
    console.error('❌ Image analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get protocol summary
// @route   GET /api/ai/protocol/:type
// @access  Private
exports.getProtocolSummary = async (req, res) => {
  try {
    const { type } = req.params;
    const protocol = emergencyProtocols[type];

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocol not found. Available types: fire, lockdown, medical, weather'
      });
    }

    // Format protocol as a summary
    let summary = `## 📋 ${protocol.name.toUpperCase()} PROTOCOL\n\n`;
    summary += `**Steps to follow:**\n`;
    protocol.steps.forEach((step, i) => {
      summary += `${i + 1}. ${step}\n`;
    });
    
    if (protocol.doNot && protocol.doNot.length > 0) {
      summary += `\n**DO NOT:**\n`;
      protocol.doNot.forEach(item => {
        summary += `- ${item}\n`;
      });
    }

    res.json({
      success: true,
      data: {
        protocol: type,
        fullProtocol: protocol,
        quickSummary: summary
      }
    });

  } catch (error) {
    console.error('❌ Protocol summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get chat history
// @route   GET /api/ai/history/:sessionId
// @access  Private
exports.getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chatSession = await ChatHistory.findOne({
      user: req.user.id,
      sessionId: sessionId
    });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      data: chatSession.messages
    });

  } catch (error) {
    console.error('❌ Get chat history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Fallback responses when Gemini API is not configured
function getFallbackResponse(message, activeEmergency) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('fire')) {
    return "🔥 **Fire Emergency Protocol:**\n\n1. Activate the nearest fire alarm\n2. Evacuate immediately using stairs (not elevators)\n3. Assemble at the designated meeting point (football field)\n4. Call Campus Security: 484-365-8139\n5. Do NOT re-enter the building until cleared by authorities\n\n⚠️ If you see active fire, call 911 immediately!";
  }
  
  if (lowerMsg.includes('lockdown')) {
    return "🔒 **Lockdown Procedure:**\n\n1. Lock all doors and windows\n2. Turn off lights and silence all devices\n3. Move out of sight lines from windows\n4. Stay quiet and wait for official all-clear\n5. Do NOT open doors for anyone until confirmed by authorities\n\nUse the Report Emergency button if you see suspicious activity.";
  }
  
  if (lowerMsg.includes('medical')) {
    return "🏥 **Medical Emergency Protocol:**\n\n1. Call 911 for life-threatening emergencies\n2. Call Health Services: 484-365-6196\n3. Do NOT move the person unless they're in danger\n4. Provide first aid only if trained\n5. Clear the area and wait for help\n\nFor mental health crisis, call 988.";
  }
  
  if (lowerMsg.includes('weather') || lowerMsg.includes('storm')) {
    return "🌩️ **Severe Weather Protocol:**\n\n1. Move to interior rooms or basement\n2. Stay away from windows and glass\n3. Monitor official announcements\n4. Wait for all-clear before going outside\n5. Do NOT use elevators during power outages";
  }
  
  if (lowerMsg.includes('check in') || lowerMsg.includes('safe')) {
    return "✅ **To check in as safe:**\n\n1. Click the 'Check-In Safe' button on your dashboard\n2. Select your status (Safe, Need Help, Evacuated)\n3. Add your current location\n4. Submit to notify authorities\n\nThis helps campus security know you're accounted for during emergencies.";
  }
  
  if (lowerMsg.includes('location') || lowerMsg.includes('share')) {
    return "📍 **To share your location:**\n\n1. Click the 'Share Location' button on your dashboard\n2. Allow location access when prompted\n3. Add your building/room details\n4. Submit to share with authorities\n\nYour location helps responders find you quickly during emergencies.";
  }
  
  if (activeEmergency) {
    return `⚠️ **Active Emergency Alert**\n\nThere is currently a ${activeEmergency.type.toUpperCase()} emergency active on campus at ${activeEmergency.location.name}.\n\n**Follow these steps:**\n1. ${activeEmergency.type === 'fire' ? 'Evacuate immediately' : activeEmergency.type === 'lockdown' ? 'Lockdown in place' : 'Follow official instructions'}\n2. Stay calm and follow protocol\n3. Check in as safe using the dashboard button\n4. Monitor for official updates\n\nFor immediate help, call Campus Security: 484-365-8139 or 911.`;
  }
  
  return "👋 Hi! I'm your AI safety assistant. I can help you with:\n\n• **Emergency protocols** (fire, lockdown, medical)\n• **Safety questions**\n• **Image analysis** (upload a photo to check for dangers)\n• **Check-in and location sharing**\n\nTry asking: 'What's the fire protocol?' or upload an image for analysis!\n\n⚠️ **For immediate emergencies, always use the Report Emergency button or call 911.**";
}