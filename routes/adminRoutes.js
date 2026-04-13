const express = require('express');
const router = express.Router();
const {
  getAllCheckIns,
  getActiveCheckIns,
  getCurrentLocations,
  getAllLocations,
  getAllEmergencies,
  updateEmergencyStatus,
  getDashboardStats,
  getCampusMapData
  // Remove getActiveCheckIns and getCurrentLocations - they don't exist
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin/staff role
router.use(protect);
router.use(authorize('admin', 'staff'));

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/map', getCampusMapData);

// Check-in routes (only the ones that exist)
router.get('/checkins', getAllCheckIns);
// router.get('/checkins/active', getActiveCheckIns);  // COMMENT THIS OUT - doesn't exist

// Location routes (only the ones that exist)
router.get('/locations', getAllLocations);
// router.get('/locations/current', getCurrentLocations);  // COMMENT THIS OUT - doesn't exist

// Emergency routes
router.get('/emergencies', getAllEmergencies);
router.put('/emergencies/:id/status', updateEmergencyStatus);

module.exports = router;