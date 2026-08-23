// src/routes/aiRoutes.js
const express = require('express');
const router  = express.Router();
const { analyzeSymptoms } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze', protect, analyzeSymptoms); // POST /api/v1/ai/analyze

module.exports = router;
