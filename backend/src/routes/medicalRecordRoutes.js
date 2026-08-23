// backend/src/routes/medicalRecordRoutes.js
const express = require('express');
const router  = express.Router();
const { getRecords, createRecord, deleteRecord } = require('../controllers/medicalRecordController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',       protect, getRecords);     // GET    /api/v1/records
router.post('/',      protect, createRecord);   // POST   /api/v1/records
router.delete('/:id', protect, deleteRecord);   // DELETE /api/v1/records/:id

module.exports = router;
