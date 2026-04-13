// aiController.js - No OpenAI required version

// Simple rule-based responses for safety questions
const getSafetyResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Fire-related questions
    if (lowerMessage.includes('fire') || lowerMessage.includes('smoke') || lowerMessage.includes('burn')) {
        return "🔥 **FIRE EMERGENCY PROTOCOL**\n\n1. Activate the nearest fire alarm immediately\n2. Evacuate using designated exits - DO NOT use elevators\n3. Stay low to avoid smoke inhalation\n4. Assemble at the football field evacuation point\n5. Call 911 and campus security at 555-0199\n6. Do not re-enter the building until cleared by authorities\n\n⚠️ If you are trapped: seal doors with wet cloths, call 911, and signal from windows.";
    }
    // Medical-related questions
    else if (lowerMessage.includes('medical') || lowerMessage.includes('injury') || lowerMessage.includes('hurt') || lowerMessage.includes('bleeding')) {
        return "🏥 **MEDICAL EMERGENCY PROTOCOL**\n\n1. Call campus health center: 484-365-7338\n2. For emergencies, call 911 immediately\n3. Do not move the injured person unless in immediate danger\n4. Apply pressure to bleeding wounds\n5. Stay with the person until help arrives\n6. Provide first aid only if you are trained\n\n📍 Health Center Location: Wellness Center Building, Room 101";
    }
    // Lockdown-related questions
    else if (lowerMessage.includes('lockdown') || lowerMessage.includes('active shooter') || lowerMessage.includes('threat')) {
        return "🔒 **LOCKDOWN PROTOCOL - RUN. HIDE. FIGHT.**\n\n**RUN:**\n- If safe, evacuate immediately\n- Know your exits\n- Leave belongings behind\n\n**HIDE:**\n- If not safe, lock doors, barricade entry\n- Turn off lights, silence devices\n- Stay away from windows\n- Stay quiet\n\n**FIGHT:**\n- As last resort, defend yourself\n- Use improvised weapons\n- Commit to your actions\n\n📞 Public Safety: 484-365-8139 | Emergency: 911";
    }
    // Weather-related questions
    else if (lowerMessage.includes('weather') || lowerMessage.includes('storm') || lowerMessage.includes('tornado') || lowerMessage.includes('lightning')) {
        return "⛈️ **WEATHER EMERGENCY PROTOCOL**\n\n1. Move to interior rooms or basements immediately\n2. Stay away from windows and glass doors\n3. Avoid using electrical equipment\n4. Do NOT use elevators\n5. Wait for weather warning to expire\n6. Monitor At the Den app for updates\n\n📱 Emergency alerts will be pushed to your device.";
    }
    // Check-in safe question
    else if (lowerMessage.includes('check in') || lowerMessage.includes('checkin') || (lowerMessage.includes('safe') && lowerMessage.includes('mark'))) {
        return "✅ **HOW TO CHECK IN SAFE**\n\n1. Click the 'Check-In Safe' button on your dashboard\n2. Select your status:\n   • ✅ I am Safe\n   • 🆘 I Need Help\n   • 🚶 I Have Evacuated\n3. Share your current location\n4. Add an optional message\n5. Click 'Check In'\n\nThis helps authorities know you're safe during emergencies.";
    }
    // Share location question
    else if (lowerMessage.includes('location') || lowerMessage.includes('share location')) {
        return "📍 **HOW TO SHARE YOUR LOCATION**\n\n1. Click the 'Share Location' button\n2. Allow location access when prompted\n3. Enter your building and room number\n4. Click 'Share My Location'\n\n🔒 Your location is shared securely with campus authorities to help them find you if needed.";
    }
    // Emergency contacts question
    else if (lowerMessage.includes('contact') || lowerMessage.includes('phone number') || lowerMessage.includes('call')) {
        return "📞 **EMERGENCY CONTACTS**\n\n**Public Safety:**\n• 🚓 Campus Security: 555-0199\n• 👮 University Police: 484-365-8139\n• 🏥 Health Center: 484-365-7338\n• 🚑 Emergency: 911\n\n**To add personal contacts:**\nClick 'Add Contact' on your dashboard to save parents, doctors, or friends for quick access during emergencies.";
    }
    // Evacuation question
    else if (lowerMessage.includes('evacuate') || lowerMessage.includes('evacuation')) {
        return "🚪 **EVACUATION PROTOCOL**\n\n1. Stay calm and move quickly\n2. Use designated evacuation routes\n3. DO NOT use elevators\n4. Help others who need assistance\n5. Gather at assembly points:\n   • Main Campus: Football Field\n   • East Campus: Parking Lot C\n   • West Campus: Student Center Lawn\n6. Wait for all-clear before returning\n\n📋 Know your building's evacuation map!";
    }
    // First aid question
    else if (lowerMessage.includes('first aid') || lowerMessage.includes('cpr') || lowerMessage.includes('help someone')) {
        return "🩺 **FIRST AID GUIDANCE**\n\n**Before helping:**\n• Ensure the scene is safe\n• Call for help (911 or 484-365-8139)\n• Get consent if possible\n\n**Basic Steps:**\n• **Bleeding**: Apply firm pressure with clean cloth\n• **Burns**: Cool with running water for 10-15 minutes\n• **Choking**: Perform Heimlich maneuver\n• **Unconscious**: Check breathing, start CPR if trained\n\n⚠️ Only provide care you're trained to give!";
    }
    // Mental health question
    else if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('mental')) {
        return "🧠 **MENTAL HEALTH SUPPORT**\n\nYou're not alone. Help is available:\n\n📞 **Campus Resources:**\n• Counseling Center: 484-365-7244\n\n🌙 **After Hours:**\n• National Suicide Prevention: 988\n• Crisis Text Line: Text HOME to 741741\n\n📍 Counseling Center: Student Union Building, 2nd Floor\n\nIt's okay to ask for help. Your wellbeing matters.";
    }
    // Welcome/greeting
    else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('help')) {
        return "👋 **Hello! I'm your At the Den Safety Assistant**\n\nI can help you with:\n\n🔥 **Fire** - Fire evacuation protocols\n🏥 **Medical** - Medical emergency response\n🔒 **Lockdown** - Active threat procedures\n⛈️ **Weather** - Severe weather safety\n✅ **Check-in** - How to mark yourself safe\n📍 **Location** - Sharing your location\n📞 **Contacts** - Emergency phone numbers\n🚪 **Evacuation** - Assembly points and routes\n🩺 **First Aid** - Basic medical guidance\n\nWhat would you like to know about campus safety?";
    }
    // Report emergency
    else if (lowerMessage.includes('report') && lowerMessage.includes('emergency')) {
        return "🚨 **HOW TO REPORT AN EMERGENCY**\n\n**Via Dashboard:**\n1. Click the 'Report Emergency' button\n2. Select the emergency type:\n   • 🔥 Fire\n   • 🏥 Medical\n   • 🔒 Lockdown\n   • ⛈️ Weather\n3. Enter your exact location\n4. Describe what's happening\n5. Click 'Report Emergency'\n\n**By Phone:**\n• Public Safety: 484-365-8139\n• Emergency: 911\n\n⚠️ If this is an active emergency, use the button NOW!";
    }
    // Default response
    else {
        return "💡 **I can help with campus safety!**\n\nTry asking me about:\n• 🔥 **Fire** - Fire evacuation steps\n• 🏥 **Medical** - Medical emergencies\n• 🔒 **Lockdown** - Active threat protocols\n• ✅ **Check-in** - How to mark yourself safe\n• 📍 **Location** - Sharing your location\n• 📞 **Contacts** - Emergency phone numbers\n\nWhat would you like to know?";
    }
};

// Chat with AI endpoint
const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        const response = getSafetyResponse(message);
        
        res.json({
            success: true,
            data: {
                message: response,
                sessionId: req.body.sessionId || 'chat_' + Date.now()
            }
        });
        
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get AI response'
        });
    }
};

// Analyze image endpoint
const analyzeImage = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                analysis: "📸 **Image Analysis**\n\nThank you for sharing this image.\n\nIf this shows an emergency situation:\n• Use the **Report Emergency** button immediately\n• Call Campus Security at 555-0199\n• Call 911 for life-threatening emergencies\n\nFor safety guidance, please describe what you see in text and I can help.\n\n⚠️ Remember: In an emergency, reporting quickly saves lives!"
            }
        });
    } catch (error) {
        console.error('Image Analysis Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze image'
        });
    }
};

module.exports = {
    chatWithAI,
    analyzeImage
};