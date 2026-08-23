// backend/src/routes/prescriptionRoutes.js
const express = require('express');
const router  = express.Router();
const { createPrescription, getPrescriptions, getPrescription, deletePrescription } = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',    protect, createPrescription);   // POST   /api/v1/prescriptions
router.get('/',     protect, getPrescriptions);      // GET    /api/v1/prescriptions
router.get('/:id',  protect, getPrescription);       // GET    /api/v1/prescriptions/:id
router.delete('/:id', protect, deletePrescription);  // DELETE /api/v1/prescriptions/:id

module.exports = router;
