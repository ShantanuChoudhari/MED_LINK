// src/routes/telemedicineRoutes.js
const express = require('express');
const router  = express.Router();
const { startCall, getRoomToken } = require('../controllers/telemedicineController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start',           protect, startCall);      // POST /api/v1/telemedicine/start
router.get('/room/:roomId/token', protect, getRoomToken); // GET  /api/v1/telemedicine/room/:id/token

module.exports = router;
