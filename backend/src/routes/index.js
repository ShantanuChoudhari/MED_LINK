// src/routes/index.js
// NOTE: This file is NOT used by app.js (routes are mounted directly there).
// It is kept here as a reference only. Do NOT require() this file in app.js.
// All route mounting is done in app.js.

// If you want to use a central router pattern in the future, update app.js to
// do: app.use('/api/v1', require('./routes/index'))
// and update this file to mount sub-routers without the /api/v1 prefix.

const express = require('express');
const router  = express.Router();

router.use('/auth',        require('./authRoutes'));
router.use('/admin',       require('./adminRoutes'));
router.use('/doctor',      require('./doctorRoutes'));
router.use('/patient',     require('./patientRoutes'));
router.use('/appointments', require('./appointmentRoutes'));
router.use('/telemedicine', require('./telemedicineRoutes'));
router.use('/ai',          require('./aiRoutes'));

module.exports = router;
