const Emergency = require('../models/Emergency');
const User = require('../models/user');
const CheckIn = require('../models/CheckIn');
const Location = require('../models/Location');
const EmergencyContact = require('../models/EmergencyContact');
const Broadcast = require('../models/Broadcast');  // ← ADD THIS LINE

// ==================== EMERGENCY FUNCTIONS ====================

const reportEmergency = async (req, res) => {
  try {
    console.log('=== REPORT EMERGENCY DEBUG ===');
    console.log('User:', req.user?._id, req.user?.name);
    console.log('Request body:', req.body);
    
    const { type, location, description, severity, peopleAffected, immediateDanger } = req.body;
    
    // Validate required fields
    if (!type || !location || !location.name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide emergency type and location name' 
      });
    }
    
    // ============ CHARACTER LIMIT VALIDATION ============
    if (description && description.length > 500) {
      return res.status(400).json({
        success: false,
        error: `Description cannot exceed 500 characters. Current length: ${description.length}`
      });
    }
    
    if (location.name && location.name.length > 200) {
      return res.status(400).json({
        success: false,
        error: `Location name cannot exceed 200 characters`
      });
    }
    
    if (location.building && location.building.length > 100) {
      return res.status(400).json({
        success: false,
        error: `Building name cannot exceed 100 characters`
      });
    }
    // ============ END CHARACTER LIMIT ============
    
    // Create emergency report
    const emergency = await Emergency.create({
      type: type,
      location: {
        name: location.name || 'Unknown',
        coordinates: location.coordinates || null,
        building: location.building || location.name.split(',')[0],
        room: location.room || null
      },
      description: description || 'No description provided',
      severity: severity || 'high',
      reportedBy: req.user._id,
      reportedByName: req.user.name,
      status: 'active',
      peopleAffected: peopleAffected || 'unknown',
      immediateDanger: immediateDanger || false,
      updates: [{
        message: `🚨 ${type.toUpperCase()} emergency reported at ${location.name}`,
        author: req.user.name,
        timestamp: new Date()
      }]
    });
    
    console.log('✅ Emergency created:', emergency._id);
    
    res.status(201).json({
      success: true,
      data: emergency,
      message: 'Emergency reported successfully. Authorities have been notified.'
    });
    
  } catch (error) {
    console.error('❌ Report emergency error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to report emergency' 
    });
  }
};

const getActiveEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({ status: 'active' })
      .populate('reportedBy', 'name')
      .sort('-createdAt');
    res.json({ success: true, data: emergencies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getEmergencyById = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: emergency });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addEmergencyUpdate = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, error: 'Not found' });
    
    emergency.updates.push({
      message: req.body.message,
      author: req.user.name,
      timestamp: new Date()
    });
    await emergency.save();
    
    res.json({ success: true, data: emergency });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const resolveEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, error: 'Not found' });
    
    emergency.status = 'resolved';
    emergency.resolvedAt = new Date();
    emergency.resolvedBy = req.user.id;
    await emergency.save();
    
    res.json({ success: true, data: emergency });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== CHECK-IN FUNCTIONS ====================

const checkInSafe = async (req, res) => {
  try {
    console.log('=== CHECK-IN DEBUG ===');
    console.log('User:', req.user?._id, req.user?.name);
    console.log('Request body:', req.body);
    
    const { status, location, message } = req.body;
    
    // Character limit for check-in message
    if (message && message.length > 200) {
      return res.status(400).json({
        success: false,
        error: `Check-in message cannot exceed 200 characters. Current length: ${message.length}`
      });
    }
    
    const checkIn = await CheckIn.create({
      user: req.user.id,
      status: status || 'safe',
      location: { name: location?.name || 'Unknown' },
      message: message || ''
    });
    
    console.log('✅ Check-in created:', checkIn._id);
    
    res.json({ success: true, data: checkIn });
  } catch (error) {
    console.error('❌ Check-in error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCheckIns = async (req, res) => {
  try {
    const checkIns = await CheckIn.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(50);
    res.json({ success: true, data: checkIns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getMyCheckIns = async (req, res) => {
  try {
    console.log('=== GET MY CHECK-INS DEBUG ===');
    console.log('User:', req.user?._id);
    
    const checkIns = await CheckIn.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(20);
    
    console.log(`✅ Found ${checkIns.length} check-ins`);
    
    res.json({ success: true, data: checkIns });
  } catch (error) {
    console.error('❌ Get check-ins error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== LOCATION FUNCTIONS ====================

const shareLocation = async (req, res) => {
  try {
    console.log('=== SHARE LOCATION DEBUG ===');
    console.log('User:', req.user?._id, req.user?.name);
    console.log('Request body:', req.body);
    
    const { coordinates, building } = req.body;
    
    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid coordinates are required' 
      });
    }
    
    const location = await Location.create({
      user: req.user.id,
      coordinates: coordinates,
      building: building || 'Unknown',
      shareWith: 'authorities'
    });
    
    console.log('✅ Location shared:', location._id);
    
    res.json({ success: true, data: location });
  } catch (error) {
    console.error('❌ Share location error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getLocationHistory = async (req, res) => {
  try {
    const locations = await Location.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(20);
    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getEmergencyLocations = async (req, res) => {
  try {
    const locations = await Location.find().populate('user', 'name').limit(50);
    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUserLocation = async (req, res) => {
  try {
    const location = await Location.findOne({ user: req.params.userId })
      .sort('-createdAt');
    res.json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== CONTACT FUNCTIONS ====================

const getEmergencyContacts = async (req, res) => {
  try {
    console.log('=== GET CONTACTS DEBUG ===');
    console.log('User:', req.user?._id);
    
    const contacts = await EmergencyContact.find({ user: req.user.id });
    
    console.log(`✅ Found ${contacts.length} contacts`);
    
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('❌ Get contacts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const addEmergencyContact = async (req, res) => {
  try {
    console.log('=== ADD CONTACT DEBUG ===');
    console.log('User:', req.user?._id, req.user?.name);
    console.log('Request body:', req.body);
    
    const { name, phone, email, relationship } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and phone number are required' 
      });
    }
    
    // Character limits for contact fields
    if (name && name.length > 100) {
      return res.status(400).json({
        success: false,
        error: `Name cannot exceed 100 characters`
      });
    }
    
    if (phone && phone.length > 20) {
      return res.status(400).json({
        success: false,
        error: `Phone number cannot exceed 20 characters`
      });
    }
    
    const contact = await EmergencyContact.create({
      user: req.user.id,
      name,
      phone,
      email,
      relationship
    });
    
    console.log('✅ Contact added:', contact._id);
    
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    console.error('❌ Add contact error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateEmergencyContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteEmergencyContact = async (req, res) => {
  try {
    await EmergencyContact.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const setPrimaryContact = async (req, res) => {
  try {
    await EmergencyContact.updateMany({ user: req.user.id }, { isPrimary: false });
    const contact = await EmergencyContact.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isPrimary: true },
      { new: true }
    );
    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getNotifyContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ user: req.user.id, isPrimary: true });
    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== BROADCAST FUNCTIONS  ====================

// STUDENT: Get all broadcasts
const getBroadcasts = async (req, res) => {
  try {
    console.log('=== GET BROADCASTS DEBUG ===');
    console.log('User:', req.user?._id, req.user?.role);
    
    const broadcasts = await Broadcast.find({
      isActive: true,
      expiresAt: { $gt: new Date() },
      $or: [
        { targetAudience: 'all' },
        { targetAudience: req.user.role === 'student' ? 'students' : req.user.role },
        { targetAudience: req.user.role }
      ]
    }).sort('-createdAt').limit(50);
    
    // Mark which broadcasts have been read by this user
    const broadcastsWithReadStatus = broadcasts.map(broadcast => {
      const isRead = broadcast.readBy.some(
        read => read.user && read.user.toString() === req.user._id.toString()
      );
      
      return {
        ...broadcast.toObject(),
        isRead
      };
    });
    
    const unreadCount = broadcastsWithReadStatus.filter(b => !b.isRead).length;
    
    console.log(`✅ Found ${broadcasts.length} broadcasts, ${unreadCount} unread`);
    
    res.json({
      success: true,
      data: broadcastsWithReadStatus,
      unreadCount: unreadCount
    });
    
  } catch (error) {
    console.error('❌ Get broadcasts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// STUDENT: Mark broadcast as read
const markBroadcastRead = async (req, res) => {
  try {
    console.log('=== MARK BROADCAST READ DEBUG ===');
    console.log('Broadcast ID:', req.params.id);
    console.log('User:', req.user?._id);
    
    const broadcast = await Broadcast.findById(req.params.id);
    
    if (!broadcast) {
      return res.status(404).json({ 
        success: false, 
        error: 'Broadcast not found' 
      });
    }
    
    // Check if already marked as read
    const alreadyRead = broadcast.readBy.some(
      read => read.user && read.user.toString() === req.user._id.toString()
    );
    
    if (!alreadyRead) {
      broadcast.readBy.push({ 
        user: req.user._id, 
        readAt: new Date() 
      });
      await broadcast.save();
      console.log('✅ Broadcast marked as read');
    } else {
      console.log('⚠️ Broadcast already marked as read');
    }
    
    res.json({ 
      success: true, 
      message: 'Broadcast marked as read' 
    });
    
  } catch (error) {
    console.error('❌ Mark broadcast read error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ==================== ADMIN FUNCTIONS ====================

const getAdminDashboard = async (req, res) => {
  try {
    console.log('=== ADMIN DASHBOARD DEBUG ===');
    
    const activeEmergencies = await Emergency.countDocuments({ status: 'active' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const checkedInToday = await CheckIn.countDocuments({ 
      status: 'safe',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const needHelp = await CheckIn.countDocuments({ 
      status: 'help-needed',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    // Get the most recent active emergency (for the banner)
    const activeEmergency = await Emergency.findOne({ status: 'active' })
      .sort('-createdAt')
      .populate('reportedBy', 'name');
    
    // Get recent check-ins (last 10)
    const recentCheckIns = await CheckIn.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(10);
    
    // Get recent locations (last 10)
    const recentLocations = await Location.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(10);
    
    // Get emergency timeline (last 10)
    const emergencyTimeline = await Emergency.find()
      .sort('-createdAt')
      .limit(10)
      .select('type status location.name createdAt');
    
    // Get recent broadcasts count
    const recentBroadcasts = await Broadcast.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    console.log(`✅ Dashboard stats: ${activeEmergencies} active, ${checkedInToday} checked in`);
    
    res.json({
      success: true,
      data: {
        stats: {
          activeEmergencies,
          totalStudents,
          checkedInToday,
          needHelp,
          safetyPercentage: totalStudents > 0 ? ((checkedInToday - needHelp) / totalStudents * 100).toFixed(1) : 0,
          notCheckedIn: totalStudents - checkedInToday,
          recentBroadcasts
        },
        activeEmergency,
        recentCheckIns,
        recentLocations,
        emergencyTimeline,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Admin dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find().sort('-createdAt').limit(50);
    res.json({ success: true, data: emergencies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllCheckIns = async (req, res) => {
  try {
    const checkIns = await CheckIn.find().populate('user', 'name').sort('-createdAt').limit(50);
    res.json({ success: true, data: checkIns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().populate('user', 'name').sort('-createdAt').limit(50);
    res.json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateEmergencyStatus = async (req, res) => {
  try {
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, data: emergency });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ADMIN: Send broadcast to database
const broadcastUpdate = async (req, res) => {
  try {
    console.log('=== SEND BROADCAST DEBUG ===');
    console.log('Admin:', req.user?.name);
    console.log('Request body:', req.body);
    
    const { title, message, priority, targetAudience } = req.body;
    
    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }
    
    if (title.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Title cannot exceed 100 characters'
      });
    }
    
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message cannot exceed 1000 characters'
      });
    }
    
    // Create broadcast in database
    const broadcast = await Broadcast.create({
      title,
      message,
      priority: priority || 'info',
      author: req.user.name,
      authorId: req.user._id,
      targetAudience: targetAudience || 'all',
      isActive: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    
    console.log('✅ Broadcast created:', broadcast._id);
    
    // Also save to active emergency if one exists
    const activeEmergency = await Emergency.findOne({ status: 'active' });
    if (activeEmergency) {
      activeEmergency.updates.push({
        message: `📢 BROADCAST: ${title} - ${message}`,
        author: req.user.name,
        timestamp: new Date()
      });
      await activeEmergency.save();
      console.log('✅ Also added to active emergency');
    }
    
    res.json({ 
      success: true, 
      data: broadcast,
      message: 'Broadcast sent successfully to all students!' 
    });
    
  } catch (error) {
    console.error('❌ Broadcast error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

const getStatistics = async (req, res) => {
  try {
    // Get emergency statistics by type
    const emergencyByType = await Emergency.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    
    // Get check-in statistics
    const checkInStats = await CheckIn.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    // Get broadcasts count
    const totalBroadcasts = await Broadcast.countDocuments();
    
    res.json({ 
      success: true, 
      data: { 
        emergenciesOverTime: emergencyByType,
        checkInTrends: checkInStats,
        totalBroadcasts
      } 
    });
  } catch (error) {
    console.error('❌ Statistics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== SINGLE EXPORT AT THE BOTTOM ====================
module.exports = {
  // Emergency functions
  reportEmergency,
  getActiveEmergencies,
  getEmergencyById,
  addEmergencyUpdate,
  resolveEmergency,
  
  // Check-in functions
  checkInSafe,
  getCheckIns,
  getMyCheckIns,
  
  // Location functions
  shareLocation,
  getLocationHistory,
  getEmergencyLocations,
  getUserLocation,
  
  // Contact functions
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  setPrimaryContact,
  getNotifyContacts,
  
  // Broadcast functions 
  getBroadcasts,
  markBroadcastRead,
  
  // Admin functions
  getAdminDashboard,
  getAllEmergencies,
  getAllCheckIns,
  getAllLocations,
  updateEmergencyStatus,
  broadcastUpdate,
  getStatistics
};

console.log('✅ emergencyController.js loaded successfully');
console.log('📋 Total exported functions:', Object.keys(module.exports).length);