const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  specialization: { type: String, required: true, index: true },
  experience: { type: Number, default: 0 },
  fees: { type: Number, required: true },
  rating: { type: Number, default: 4.8 },
  hospital: { type: String, default: 'General Hospital' },
  location: { type: String, default: 'New York' },
  isAvailable: { type: Boolean, default: true },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  availability: { type: [String], default: ['09:00', '10:00', '14:00', '15:00'] }, // time slots
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);