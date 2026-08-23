// backend/src/models/MedicalRecord.js
const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title:      { type: String, required: true },
  category:   { type: String, enum: ['Lab Results', 'Consultation', 'Prescription', 'Imaging', 'Surgery', 'Other'], default: 'Other' },
  description:{ type: String, default: '' },
  fileUrl:    { type: String, default: '' },  // S3 URL or base64 in demo
  fileSize:   { type: String, default: '' },
  provider:   { type: String, default: '' },
  date:       { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
