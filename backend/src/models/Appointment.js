const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ✅ Added patient ref
  patientName: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g. "09:00 AM"
  type: {
    type: String,
    enum: ['Consultation', 'Follow-up', 'Video Call', 'Report Review'],
    default: 'Consultation'
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  slotType: { type: String, enum: ['Morning', 'Afternoon', 'Evening'], default: 'Morning' },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);