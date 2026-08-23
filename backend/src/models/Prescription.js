// backend/src/models/Prescription.js
const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  doctor:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String },
  medicines: [{
    name:      { type: String, required: true },
    dosage:    { type: String, default: '' },   // e.g. "500mg"
    frequency: { type: String, default: '' },   // e.g. "Twice daily"
    duration:  { type: String, default: '' },   // e.g. "7 days"
  }],
  diagnosis:   { type: String, default: '' },
  notes:       { type: String, default: '' },
  validTill:   { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
