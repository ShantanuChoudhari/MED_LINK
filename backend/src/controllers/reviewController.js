// backend/src/controllers/reviewController.js
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');

// POST /api/v1/reviews — Patient posts a review for a doctor
exports.createReview = async (req, res) => {
  try {
    const { doctorId, rating, comment, appointmentId } = req.body;
    if (!doctorId || !rating) {
      return res.status(400).json({ success: false, message: 'doctorId and rating are required.' });
    }

    // Upsert: update if already reviewed, create otherwise
    const review = await Review.findOneAndUpdate(
      { doctor: doctorId, patient: req.user.id },
      {
        patientName: req.user.name,
        rating:      Number(rating),
        comment:     comment     || '',
        appointment: appointmentId || undefined,
      },
      { upsert: true, new: true }
    );

    // Recalculate doctor's average rating
    const allReviews = await Review.find({ doctor: doctorId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Doctor.findByIdAndUpdate(doctorId, { rating: Math.round(avg * 10) / 10 });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/reviews/:doctorId — Get all reviews for a doctor
exports.getDoctorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ doctor: req.params.doctorId })
      .populate('patient', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
