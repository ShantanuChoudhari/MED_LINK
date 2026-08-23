// backend/src/routes/reviewRoutes.js
const express = require('express');
const router  = express.Router();
const { createReview, getDoctorReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',              protect, createReview);      // POST /api/v1/reviews
router.get('/doctor/:doctorId',        getDoctorReviews);  // GET  /api/v1/reviews/doctor/:doctorId

module.exports = router;
