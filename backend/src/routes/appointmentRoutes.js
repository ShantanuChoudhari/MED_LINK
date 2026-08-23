// src/routes/appointmentRoutes.js
const express = require('express');
const router  = express.Router();
const { bookAppointment, getAppointments, updateStatus } = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',              protect, bookAppointment);   // POST   /api/v1/appointments
router.get('/',               protect, getAppointments);   // GET    /api/v1/appointments
router.patch('/:id/status',  protect, updateStatus);       // PATCH  /api/v1/appointments/:id/status

module.exports = router;
