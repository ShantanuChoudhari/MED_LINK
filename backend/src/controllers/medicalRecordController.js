// backend/src/controllers/medicalRecordController.js
const MedicalRecord = require('../models/MedicalRecord');

// GET /api/v1/records — Get patient's own records
exports.getRecords = async (req, res) => {
  try {
    const query = req.user.role === 'patient'
      ? { patient: req.user.id }
      : req.user.role === 'doctor'
        ? {}   // doctor can see all (could restrict to their patients)
        : {};

    const records = await MedicalRecord.find(query)
      .populate('doctor',  'name specialization')
      .populate('patient', 'name email')
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/records — Create a record
exports.createRecord = async (req, res) => {
  try {
    const { patientId, title, category, description, provider, fileUrl, fileSize, date } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required.' });

    const record = await MedicalRecord.create({
      patient:     patientId || req.user.id,
      doctor:      req.user.role === 'doctor' ? req.user.id : undefined,
      title,
      category:    category    || 'Other',
      description: description || '',
      provider:    provider    || '',
      fileUrl:     fileUrl     || '',
      fileSize:    fileSize    || '',
      date:        date ? new Date(date) : new Date(),
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/records/:id
exports.deleteRecord = async (req, res) => {
  try {
    const rec = await MedicalRecord.findById(req.params.id);
    if (!rec) return res.status(404).json({ success: false, message: 'Record not found.' });
    // Only the patient who owns it or an admin can delete
    if (req.user.role === 'patient' && rec.patient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await rec.deleteOne();
    res.status(200).json({ success: true, message: 'Record deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
