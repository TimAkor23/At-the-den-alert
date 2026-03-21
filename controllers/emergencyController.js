const Emergency = require('../models/Emergency');
const User = require('../models/User');
const CheckIn = require('../models/CheckIn');
const Location = require('../models/Location');
const EmergencyContact = require('../models/EmergencyContact');
// @desc    Report a new emergency
// @route   POST /api/emergency/report
// @access  Private
exports.reportEmergency = async (req, res) => {
  try {
    console.log('🚨 Report emergency function started');
    
    const {
      type,
      location,
      description,
      severity,
      peopleAffected,
      immediateDanger
    } = req.body;

    // Validate required fields
    if (!type || !location || !location.name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Please provide emergency type, location, and description'
      });
    }

    // Get user info from auth middleware
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create emergency report
    const emergency = await Emergency.create({
      type,
      status: 'active',
      severity: severity || 5,
      location: {
        name: location.name,
        building: location.building || '',
        room: location.room || '',
        coordinates: location.coordinates || [0, 0]
      },
      description,
      reportedBy: req.user.id,
      reportedByName: user.name,
      peopleAffected: peopleAffected || 'unknown',
      immediateDanger: immediateDanger || false,
      updates: [{
        message: `🚨 ${type.toUpperCase()} emergency reported at ${location.name}`,
        author: req.user.id,
        authorName: user.name,
        timestamp: new Date()
      }]
    });

    console.log('✅ Emergency reported with ID:', emergency._id);

    res.status(201).json({
      success: true,
      data: emergency,
      message: 'Emergency reported successfully'
    });

  } catch (error) {
    console.error('❌ Report emergency error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all active emergencies
// @route   GET /api/emergency/active
// @access  Public
exports.getActiveEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({ status: 'active' })
      .sort('-createdAt')
      .populate('reportedBy', 'name email')
      .populate('updates.author', 'name');

    res.json({
      success: true,
      count: emergencies.length,
      data: emergencies
    });

  } catch (error) {
    console.error('❌ Get active emergencies error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single emergency by ID
// @route   GET /api/emergency/:id
// @access  Private
exports.getEmergencyById = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('updates.author', 'name');

    if (!emergency) {
      return res.status(404).json({
        success: false,
        error: 'Emergency not found'
      });
    }

    res.json({
      success: true,
      data: emergency
    });

  } catch (error) {
    console.error('❌ Get emergency error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Add update to emergency
// @route   POST /api/emergency/:id/updates
// @access  Private
exports.addEmergencyUpdate = async (req, res) => {
  try {
    const { message } = req.body;
    const emergencyId = req.params.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an update message'
      });
    }

    const emergency = await Emergency.findById(emergencyId);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        error: 'Emergency not found'
      });
    }

    // Get user info
    const user = await User.findById(req.user.id);

    // Add update
    emergency.updates.push({
      message,
      author: req.user.id,
      authorName: user.name,
      timestamp: new Date()
    });

    await emergency.save();

    res.json({
      success: true,
      data: emergency
    });

  } catch (error) {
    console.error('❌ Add update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Resolve an emergency
// @route   PUT /api/emergency/:id/resolve
// @access  Private (staff/admin only)
exports.resolveEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        error: 'Emergency not found'
      });
    }

    emergency.status = 'resolved';
    emergency.resolvedAt = new Date();
    emergency.resolvedBy = req.user.id;

    emergency.updates.push({
      message: '✅ Emergency has been resolved',
      author: req.user.id,
      authorName: req.user.name,
      timestamp: new Date()
    });

    await emergency.save();

    res.json({
      success: true,
      data: emergency,
      message: 'Emergency resolved successfully'
    });

  } catch (error) {
    console.error('❌ Resolve emergency error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// CHECK-IN SAFE FUNCTIONS
// ============================================

// @desc    Check-in as safe
// @route   POST /api/emergency/checkin
// @access  Private
exports.checkInSafe = async (req, res) => {
  try {
    console.log('✅ Check-in function started');
    
    const { location, status, message, checkInType, emergencyId } = req.body;
    
    // Get user info
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Create check-in record
    const checkIn = await CheckIn.create({
      user: req.user.id,
      userName: user.name,
      location: {
        name: location?.name || 'Unknown',
        building: location?.building || '',
        room: location?.room || '',
        coordinates: location?.coordinates || [0, 0]
      },
      status: status || 'safe',
      message: message || '',
      checkInType: checkInType || 'manual',
      emergencyId: emergencyId || null
    });
    
    // Update user's safe status and last check-in time
    user.safeStatus = true;
    user.lastCheckIn = new Date();
    
    // Update location if provided
    if (location?.coordinates) {
      user.lastLocation = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }
    
    await user.save();
    
    // If there's an active emergency, add this check-in to emergency updates
    if (emergencyId) {
      const emergency = await Emergency.findById(emergencyId);
      if (emergency) {
        emergency.updates.push({
          message: `✅ ${user.name} has checked in as SAFE from ${location?.name || 'unknown location'}`,
          author: req.user.id,
          authorName: user.name,
          timestamp: new Date()
        });
        await emergency.save();
      }
    }
    
    console.log('✅ Check-in saved for user:', user.name);
    
    res.status(201).json({
      success: true,
      data: checkIn,
      message: 'You have been marked as safe!'
    });
    
  } catch (error) {
    console.error('❌ Check-in error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all check-ins for current emergency
// @route   GET /api/emergency/checkins
// @access  Private
exports.getCheckIns = async (req, res) => {
  try {
    const { emergencyId } = req.query;
    
    let query = {};
    if (emergencyId) {
      query.emergencyId = emergencyId;
    }
    
    const checkIns = await CheckIn.find(query)
      .sort('-createdAt')
      .populate('user', 'name email');
    
    // Get statistics
    const total = checkIns.length;
    const safe = checkIns.filter(c => c.status === 'safe').length;
    const helpNeeded = checkIns.filter(c => c.status === 'help-needed').length;
    const evacuated = checkIns.filter(c => c.status === 'evacuated').length;
    
    res.json({
      success: true,
      count: total,
      statistics: {
        total,
        safe,
        helpNeeded,
        evacuated,
        safePercentage: total > 0 ? ((safe / total) * 100).toFixed(1) : 0
      },
      data: checkIns
    });
    
  } catch (error) {
    console.error('❌ Get check-ins error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get user's check-in history
// @route   GET /api/emergency/checkins/me
// @access  Private
exports.getMyCheckIns = async (req, res) => {
  try {
    const checkIns = await CheckIn.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(10);
    
    res.json({
      success: true,
      count: checkIns.length,
      data: checkIns
    });
    
  } catch (error) {
    console.error('❌ Get my check-ins error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


// ============================================
// SHARE LOCATION FUNCTIONS
// ============================================

exports.shareLocation = async (req, res) => {
  try {
    console.log('📍 Share location function started');
    
    const { 
      coordinates, 
      accuracy, 
      location, 
      shareWith, 
      emergencyId,
      batteryLevel,
      deviceInfo 
    } = req.body;
    
    // Validate required fields
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      return res.status(400).json({
        success: false,
        error: 'Please provide coordinates (latitude and longitude)'
      });
    }
    
    // Get user info
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Format coordinates as [longitude, latitude] for GeoJSON
    const formattedCoordinates = [coordinates.longitude, coordinates.latitude];
    
    // Create location record
    const locationRecord = await Location.create({
      user: req.user.id,
      userName: user.name,
      coordinates: formattedCoordinates,
      accuracy: accuracy || null,
      location: {
        name: location?.name || 'Unknown',
        building: location?.building || '',
        room: location?.room || '',
        address: location?.address || ''
      },
      shareWith: shareWith || 'authorities',
      emergencyId: emergencyId || null,
      isEmergencyLocation: !!emergencyId,
      batteryLevel: batteryLevel || null,
      deviceInfo: deviceInfo || null,
      timestamp: new Date()
    });
    
    // Update user's current location
    user.lastLocation = {
      type: 'Point',
      coordinates: formattedCoordinates
    };
    user.lastLocationUpdate = new Date();
    await user.save();
    
    // If there's an active emergency, add this location to the emergency
    if (emergencyId) {
      const emergency = await Emergency.findById(emergencyId);
      if (emergency) {
        // Add to user locations array
        if (!emergency.userLocations) {
          emergency.userLocations = [];
        }
        emergency.userLocations.push({
          user: req.user.id,
          name: user.name,
          coordinates: formattedCoordinates,
          timestamp: new Date()
        });
        await emergency.save();
        
        // Also add a small update
        emergency.updates.push({
          message: `📍 ${user.name} shared their location from ${location?.name || 'unknown location'}`,
          author: req.user.id,
          authorName: user.name,
          timestamp: new Date()
        });
        await emergency.save();
      }
    }
    
    console.log('✅ Location shared for user:', user.name);
    
    res.status(201).json({
      success: true,
      data: locationRecord,
      message: 'Location shared successfully'
    });
    
  } catch (error) {
    console.error('❌ Share location error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get user's location history
// @route   GET /api/emergency/location/history
// @access  Private
exports.getLocationHistory = async (req, res) => {
  try {
    const { limit = 10, days = 7 } = req.query;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const locations = await Location.find({
      user: req.user.id,
      timestamp: { $gte: cutoffDate }
    })
      .sort('-timestamp')
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: locations.length,
      data: locations
    });
    
  } catch (error) {
    console.error('❌ Get location history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all locations for an emergency (staff/admin only)
// @route   GET /api/emergency/locations/emergency/:emergencyId
// @access  Private (staff/admin)
exports.getEmergencyLocations = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    
    const locations = await Location.find({ emergencyId })
      .sort('-timestamp')
      .populate('user', 'name email');
    
    // Group by user for statistics
    const usersByLocation = {};
    locations.forEach(loc => {
      const key = loc.user._id.toString();
      if (!usersByLocation[key]) {
        usersByLocation[key] = {
          user: loc.user,
          lastLocation: loc,
          locations: []
        };
      }
      usersByLocation[key].locations.push(loc);
    });
    
    res.json({
      success: true,
      count: locations.length,
      uniqueUsers: Object.keys(usersByLocation).length,
      data: locations,
      userSummary: Object.values(usersByLocation)
    });
    
  } catch (error) {
    console.error('❌ Get emergency locations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get latest location for a specific user
// @route   GET /api/emergency/location/user/:userId
// @access  Private (staff/admin only)
exports.getUserLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const location = await Location.findOne({ user: userId })
      .sort('-timestamp')
      .populate('user', 'name email');
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'No location found for this user'
      });
    }
    
    res.json({
      success: true,
      data: location
    });
    
  } catch (error) {
    console.error('❌ Get user location error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// EMERGENCY CONTACTS FUNCTIONS
// ============================================

// @desc    Get all emergency contacts for current user
// @route   GET /api/emergency/contacts
// @access  Private
exports.getEmergencyContacts = async (req, res) => {
  try {
    console.log('📞 Get emergency contacts function started');
    
    // Get user's personal contacts
    const personalContacts = await EmergencyContact.find({ 
      user: req.user.id,
      isPublic: false
    }).sort({ isPrimary: -1, name: 1 });
    
    // Get public emergency contacts (campus security, police, etc.)
    const publicContacts = await EmergencyContact.find({ 
      isPublic: true 
    }).sort({ priority: 1, name: 1 });
    
    res.json({
      success: true,
      data: {
        personal: personalContacts,
        public: publicContacts
      },
      counts: {
        personal: personalContacts.length,
        public: publicContacts.length,
        total: personalContacts.length + publicContacts.length
      }
    });
    
  } catch (error) {
    console.error('❌ Get emergency contacts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Add new emergency contact
// @route   POST /api/emergency/contacts
// @access  Private
// @desc    Add new emergency contact
// @route   POST /api/emergency/contacts
// @access  Private
exports.addEmergencyContact = async (req, res) => {
  try {
    console.log('➕ Add emergency contact function started');
    
    const {
      name,
      relationship,
      phone,
      secondaryPhone,
      email,
      address,
      isPrimary,
      notifyOnEmergency,
      notes,
      priority
    } = req.body;
    
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Name and phone number are required'
      });
    }
    
    // If setting as primary, unset any existing primary contacts
    if (isPrimary) {
      await EmergencyContact.updateMany(
        { user: req.user.id, isPrimary: true },
        { isPrimary: false }
      );
    }
    
    // Create new contact
    const contact = await EmergencyContact.create({
      user: req.user.id,
      name,
      relationship: relationship || 'other',
      phone,
      secondaryPhone: secondaryPhone || '',
      email: email || '',
      address: address || '',
      isPrimary: isPrimary || false,
      notifyOnEmergency: notifyOnEmergency !== false,
      notes: notes || '',
      priority: priority || 3,
      isPublic: false,
      type: 'personal'
    });
    
    console.log('✅ Emergency contact added:', contact._id);
    
    res.status(201).json({
      success: true,
      data: contact,
      message: 'Emergency contact added successfully'
    });
    
  } catch (error) {
    console.error('❌ Add emergency contact error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update emergency contact
// @route   PUT /api/emergency/contacts/:id
// @access  Private
exports.updateEmergencyContact = async (req, res) => {
  try {
    console.log('✏️ Update emergency contact function started');
    
    const { id } = req.params;
    const updates = req.body;
    
    // Find contact and verify ownership
    const contact = await EmergencyContact.findOne({
      _id: id,
      user: req.user.id,
      isPublic: false
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }
    
    // If setting as primary, unset other primary contacts
    if (updates.isPrimary && !contact.isPrimary) {
      await EmergencyContact.updateMany(
        { user: req.user.id, isPrimary: true },
        { isPrimary: false }
      );
    }
    
    // Update contact
    const updatedContact = await EmergencyContact.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    console.log('✅ Emergency contact updated:', id);
    
    res.json({
      success: true,
      data: updatedContact,
      message: 'Emergency contact updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Update emergency contact error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete emergency contact
// @route   DELETE /api/emergency/contacts/:id
// @access  Private
exports.deleteEmergencyContact = async (req, res) => {
  try {
    console.log('🗑️ Delete emergency contact function started');
    
    const { id } = req.params;
    
    // Find contact and verify ownership
    const contact = await EmergencyContact.findOneAndDelete({
      _id: id,
      user: req.user.id,
      isPublic: false
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }
    
    console.log('✅ Emergency contact deleted:', id);
    
    res.json({
      success: true,
      message: 'Emergency contact deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Delete emergency contact error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Set primary emergency contact
// @route   PUT /api/emergency/contacts/:id/primary
// @access  Private
exports.setPrimaryContact = async (req, res) => {
  try {
    console.log('⭐ Set primary contact function started');
    
    const { id } = req.params;
    
    // Find contact and verify ownership
    const contact = await EmergencyContact.findOne({
      _id: id,
      user: req.user.id,
      isPublic: false
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }
    
    // Unset all primary contacts
    await EmergencyContact.updateMany(
      { user: req.user.id, isPrimary: true },
      { isPrimary: false }
    );
    
    // Set this contact as primary
    contact.isPrimary = true;
    await contact.save();
    
    console.log('✅ Primary contact set:', id);
    
    res.json({
      success: true,
      data: contact,
      message: 'Primary contact set successfully'
    });
    
  } catch (error) {
    console.error('❌ Set primary contact error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get emergency contacts with notification settings
// @route   GET /api/emergency/contacts/notify
// @access  Private
exports.getNotifyContacts = async (req, res) => {
  try {
    console.log('🔔 Get notify contacts function started');
    
    const contacts = await EmergencyContact.find({
      user: req.user.id,
      notifyOnEmergency: true
    }).sort({ isPrimary: -1, name: 1 });
    
    res.json({
      success: true,
      count: contacts.length,
      data: contacts
    });
    
  } catch (error) {
    console.error('❌ Get notify contacts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};