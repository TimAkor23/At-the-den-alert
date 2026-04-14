const CheckIn = require('../models/CheckIn');
const Location = require('../models/Location');
const Emergency = require('../models/Emergency');
const User = require('../models/user');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin/Staff)
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const activeEmergencies = await Emergency.countDocuments({ status: 'active' });
    const resolvedEmergencies = await Emergency.countDocuments({ status: 'resolved' });
    
    // Get today's check-ins (last 24 hours)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCheckIns = await CheckIn.countDocuments({
      timestamp: { $gte: today }
    });
    
    // Get safe vs unsafe counts
    const safeUsers = await User.countDocuments({ safeStatus: true });
    const unsafeUsers = await User.countDocuments({ safeStatus: false });
    
    // Get recent emergencies (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentEmergencies = await Emergency.find({
      createdAt: { $gte: lastWeek }
    }).sort('-createdAt').limit(5);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        activeEmergencies,
        resolvedEmergencies,
        todayCheckIns,
        safeUsers,
        unsafeUsers,
        recentEmergencies
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all check-ins
// @route   GET /api/admin/checkins
// @access  Private (Admin/Staff)
exports.getAllCheckIns = async (req, res) => {
  try {
    const { limit = 100, status, date } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.timestamp = { $gte: startDate, $lte: endDate };
    }
    
    const checkIns = await CheckIn.find(query)
      .populate('user', 'name email role')
      .sort('-timestamp')
      .limit(parseInt(limit));
    
    // Get summary statistics
    const totalCheckIns = await CheckIn.countDocuments(query);
    const safeCount = await CheckIn.countDocuments({ ...query, status: 'safe' });
    const helpNeededCount = await CheckIn.countDocuments({ ...query, status: 'help-needed' });
    
    res.json({
      success: true,
      data: {
        checkIns,
        summary: {
          total: totalCheckIns,
          safe: safeCount,
          helpNeeded: helpNeededCount
        }
      }
    });
  } catch (error) {
    console.error('Get check-ins error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get active check-ins (last hour)
// @route   GET /api/admin/checkins/active
// @access  Private (Admin/Staff)
exports.getActiveCheckIns = async (req, res) => {
  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const activeCheckIns = await CheckIn.find({
      timestamp: { $gte: oneHourAgo }
    }).populate('user', 'name email role location');
    
    res.json({
      success: true,
      count: activeCheckIns.length,
      data: activeCheckIns
    });
  } catch (error) {
    console.error('Get active check-ins error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all locations
// @route   GET /api/admin/locations
// @access  Private (Admin/Staff)
exports.getAllLocations = async (req, res) => {
  try {
    const { limit = 100, hours = 24 } = req.query;
    
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - parseInt(hours));
    
    const locations = await Location.find({
      timestamp: { $gte: timeAgo }
    })
      .populate('user', 'name email role')
      .sort('-timestamp')
      .limit(parseInt(limit));
    
    // Group locations by building
    const buildings = {};
    locations.forEach(loc => {
      const building = loc.building || 'Unknown';
      if (!buildings[building]) buildings[building] = 0;
      buildings[building]++;
    });
    
    res.json({
      success: true,
      data: {
        locations,
        summary: {
          total: locations.length,
          buildings
        }
      }
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get current locations (most recent per user)
// @route   GET /api/admin/locations/current
// @access  Private (Admin/Staff)
exports.getCurrentLocations = async (req, res) => {
  try {
    // Get most recent location for each user
    const users = await User.find({}, '_id name email role');
    const currentLocations = [];
    
    for (const user of users) {
      const lastLocation = await Location.findOne({ user: user._id })
        .sort('-timestamp');
      
      if (lastLocation) {
        currentLocations.push({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          location: lastLocation,
          lastUpdated: lastLocation.timestamp
        });
      }
    }
    
    res.json({
      success: true,
      count: currentLocations.length,
      data: currentLocations
    });
  } catch (error) {
    console.error('Get current locations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all emergencies
// @route   GET /api/admin/emergencies
// @access  Private (Admin/Staff)
exports.getAllEmergencies = async (req, res) => {
  try {
    const { status, type, limit = 50 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    
    const emergencies = await Emergency.find(query)
      .populate('reportedBy', 'name email')
      .populate('updates.author', 'name')
      .sort('-createdAt')
      .limit(parseInt(limit));
    
    // Get statistics
    const stats = {
      total: await Emergency.countDocuments(),
      active: await Emergency.countDocuments({ status: 'active' }),
      resolved: await Emergency.countDocuments({ status: 'resolved' }),
      byType: {}
    };
    
    // Count by type
    const types = ['fire', 'lockdown', 'medical', 'weather', 'active-threat', 'other'];
    for (const type of types) {
      stats.byType[type] = await Emergency.countDocuments({ type });
    }
    
    res.json({
      success: true,
      data: {
        emergencies,
        stats
      }
    });
  } catch (error) {
    console.error('Get emergencies error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update emergency status
// @route   PUT /api/admin/emergencies/:id/status
// @access  Private (Admin/Staff)
exports.updateEmergencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    
    const emergency = await Emergency.findById(id);
    
    if (!emergency) {
      return res.status(404).json({
        success: false,
        error: 'Emergency not found'
      });
    }
    
    emergency.status = status;
    
    if (status === 'resolved') {
      emergency.resolvedAt = new Date();
      emergency.resolvedBy = req.user.id;
      
      emergency.updates.push({
        message: resolutionNotes || 'Emergency has been resolved by staff',
        author: req.user.id,
        authorName: req.user.name,
        timestamp: new Date()
      });
    }
    
    await emergency.save();
    
    res.json({
      success: true,
      data: emergency,
      message: `Emergency status updated to ${status}`
    });
  } catch (error) {
    console.error('Update emergency error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get campus map data (locations for map visualization)
// @route   GET /api/admin/dashboard/map
// @access  Private (Admin/Staff)
exports.getCampusMapData = async (req, res) => {
  try {
    // Get recent locations with coordinates
    const locations = await Location.find({
      'coordinates.0': { $ne: 0 }, // Has valid coordinates
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
      .populate('user', 'name role safeStatus')
      .limit(200);
    
    // Get active emergencies with locations
    const emergencies = await Emergency.find({
      status: 'active',
      'location.coordinates.0': { $ne: 0 }
    });
    
    // Get safe check-ins for heatmap
    const safeCheckIns = await CheckIn.find({
      status: 'safe',
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      success: true,
      data: {
        userLocations: locations,
        activeEmergencies: emergencies,
        safeCheckIns: safeCheckIns,
        campusBuildings: [
          { name: 'Science Building', coordinates: [-75.123, 39.456] },
          { name: 'Library', coordinates: [-75.124, 39.457] },
          { name: 'Student Center', coordinates: [-75.122, 39.455] },
          { name: 'Administration', coordinates: [-75.125, 39.458] }
        ]
      }
    });
  } catch (error) {
    console.error('Get map data error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};