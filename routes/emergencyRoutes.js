const express = require('express');
const router = express.Router();
const {
  // ============ STUDENT / PUBLIC FUNCTIONS ============
  reportEmergency,
  checkInSafe,
  shareLocation,
  getEmergencyContacts,
  addEmergencyContact,
  getMyCheckIns,
  getActiveEmergencies,
  
  // ============ BROADCAST FUNCTIONS (Student + Admin) ============
  getBroadcasts,           // Students fetch broadcasts
  markBroadcastRead,       // Students mark broadcasts as read
  
  // ============ ADMIN FUNCTIONS ============
  getAdminDashboard,
  getAllEmergencies,
  getAllCheckIns,
  getAllLocations,
  updateEmergencyStatus,
  broadcastUpdate,         // Admin sends broadcasts
  getStatistics
} = require('../controllers/emergencyController');
const { protect, authorize } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (No authentication needed)
// ============================================
router.get('/active', getActiveEmergencies);


// ============================================
// STUDENT ROUTES (Authentication required)
// ============================================

// --- Emergency Actions ---
router.post('/report', protect, reportEmergency);      // Report new emergency
router.post('/checkin', protect, checkInSafe);         // Check-in as safe
router.post('/location', protect, shareLocation);      // Share current location

// --- Emergency Contacts ---
router.get('/contacts', protect, getEmergencyContacts);   // Get my contacts
router.post('/contacts', protect, addEmergencyContact);   // Add new contact

// --- Check-ins ---
router.get('/checkins/me', protect, getMyCheckIns);       // View my check-in history

// --- Broadcasts (Student view) ---
router.get('/broadcasts', protect, getBroadcasts);        // Get all broadcasts
router.put('/broadcasts/:id/read', protect, markBroadcastRead);  // Mark as read


// ============================================
// ADMIN ROUTES (Authentication + Admin role required)
// ============================================

// --- Dashboard & Overview ---
router.get('/admin/dashboard', protect, authorize('admin'), getAdminDashboard);
router.get('/admin/statistics', protect, authorize('admin'), getStatistics);

// --- Emergency Management ---
router.get('/admin/emergencies', protect, authorize('admin'), getAllEmergencies);
router.put('/admin/emergency/:id/status', protect, authorize('admin'), updateEmergencyStatus);

// --- User Tracking ---
router.get('/admin/checkins', protect, authorize('admin'), getAllCheckIns);
router.get('/admin/locations', protect, authorize('admin'), getAllLocations);

// --- Communications ---
router.post('/admin/broadcast', protect, authorize('admin'), broadcastUpdate);  // Send broadcast to students

module.exports = router;