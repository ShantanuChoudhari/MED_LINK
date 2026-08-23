// backend/src/controllers/prescriptionController.js
const Prescription   = require('../models/Prescription');
const Notification   = require('../models/Notification');

// Helper: create notification
const notify = async (userId, type, title, message) => {
  try { await Notification.create({ user: userId, type, title, message }); } catch {}
};

// POST /api/v1/prescriptions — Doctor creates prescription
exports.createPrescription = async (req, res) => {
  try {
    const { patientId, patientName, appointmentId, medicines, diagnosis, notes, validTill } = req.body;
    if (!patientId || !medicines || medicines.length === 0) {
      return res.status(400).json({ success: false, message: 'patientId and at least one medicine required.' });
    }

    const prescription = await Prescription.create({
      appointment: appointmentId || null,
      doctor:      req.user.id,
      patient:     patientId,
      patientName: patientName || 'Unknown',
      medicines,
      diagnosis:   diagnosis || '',
      notes:       notes     || '',
      validTill:   validTill ? new Date(validTill) : null,
    });

    await prescription.populate('doctor', 'name');

    // Notify the patient
    await notify(patientId, 'prescription', '📋 New Prescription',
      `Dr. ${req.user.name} has issued you a prescription for ${diagnosis || 'your condition'}.`);

    res.status(201).json({ success: true, data: prescription });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/prescriptions — List own prescriptions (doctor sees issued, patient sees received)
exports.getPrescriptions = async (req, res) => {
  try {
    const query = req.user.role === 'doctor'
      ? { doctor:  req.user.id }
      : { patient: req.user.id };

    const prescriptions = await Prescription.find(query)
      .populate('doctor',  'name specialization')
      .populate('patient', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/prescriptions/:id
exports.getPrescription = async (req, res) => {
  try {
    const p = await Prescription.findById(req.params.id)
      .populate('doctor',  'name specialization')
      .populate('patient', 'name email');
    if (!p) return res.status(404).json({ success: false, message: 'Prescription not found.' });
    res.status(200).json({ success: true, data: p });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/prescriptions/:id — Doctor can delete their own prescription
exports.deletePrescription = async (req, res) => {
  try {
    const p = await Prescription.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Prescription not found.' });
    if (p.doctor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await p.deleteOne();
    res.status(200).json({ success: true, message: 'Prescription deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
