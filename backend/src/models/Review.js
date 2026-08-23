// backend/src/models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  doctor:     { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patient:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  patientName:{ type: String, required: true },
  rating:     { type: Number, required: true, min: 1, max: 5 },
  comment:    { type: String, default: '' },
  appointment:{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
}, { timestamps: true });

// One review per patient per doctor
reviewSchema.index({ doctor: 1, patient: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
