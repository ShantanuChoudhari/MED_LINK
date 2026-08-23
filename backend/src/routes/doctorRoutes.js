// backend/src/routes/doctorRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getDashboardData,
  updateAppointmentStatus,
  getMyPatients,
  getProfile,
  updateProfile,
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard',           protect, authorize('doctor'), getDashboardData);
router.get('/patients',            protect, authorize('doctor'), getMyPatients);
router.get('/profile',             protect,                      getProfile);
router.put('/profile',             protect, authorize('doctor'), updateProfile);
router.patch('/appointments/:id/status', protect, authorize('doctor'), updateAppointmentStatus);

module.exports = router;