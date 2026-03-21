const express = require('express');
const router = express.Router();
const { 
  reportEmergency, 
  getActiveEmergencies,
  getEmergencyById,
  addEmergencyUpdate,
  resolveEmergency,
  checkInSafe,
  getCheckIns,
  getMyCheckIns,
  shareLocation,
  getLocationHistory,
  getEmergencyLocations,
  getUserLocation,
  getEmergencyContacts,      // Add this
  addEmergencyContact,       // Add this
  updateEmergencyContact,    // Add this
  deleteEmergencyContact,    // Add this
  setPrimaryContact,         // Add this
  getNotifyContacts          // Add this
} = require('../controllers/emergencyController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/active', getActiveEmergencies);

// Protected routes - Check-in
router.post('/checkin', protect, checkInSafe);
router.get('/checkins', protect, getCheckIns);
router.get('/checkins/me', protect, getMyCheckIns);

// Protected routes - Location
router.post('/location', protect, shareLocation);
router.get('/location/history', protect, getLocationHistory);
router.get('/locations/emergency/:emergencyId', protect, authorize('staff', 'admin'), getEmergencyLocations);
router.get('/location/user/:userId', protect, authorize('staff', 'admin'), getUserLocation);

// Protected routes - Emergency Contacts
router.get('/contacts', protect, getEmergencyContacts);           // Get all contacts
router.post('/contacts', protect, addEmergencyContact);           // Add new contact
router.get('/contacts/notify', protect, getNotifyContacts);       // Get contacts to notify
router.put('/contacts/:id', protect, updateEmergencyContact);     // Update contact
router.delete('/contacts/:id', protect, deleteEmergencyContact);  // Delete contact
router.put('/contacts/:id/primary', protect, setPrimaryContact);  // Set as primary

// Protected routes - Emergency
router.post('/report', protect, reportEmergency);
router.get('/:id', protect, getEmergencyById);
router.post('/:id/updates', protect, addEmergencyUpdate);

// Staff/Admin only routes
router.put('/:id/resolve', protect, authorize('staff', 'admin'), resolveEmergency);

module.exports = router;