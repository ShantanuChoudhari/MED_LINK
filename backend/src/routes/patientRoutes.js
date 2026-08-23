const express = require('express');
const router = express.Router();
const { analyzeSymptoms, searchDoctors } = require('../controllers/patientController');
// Note: We might not strictly protect these if you want public search
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze', protect, analyzeSymptoms);
router.get('/doctors', protect, searchDoctors);

module.exports = router;