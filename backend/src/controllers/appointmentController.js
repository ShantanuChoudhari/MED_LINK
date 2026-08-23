// src/controllers/appointmentController.js
const Appointment  = require('../models/Appointment');
const Notification = require('../models/Notification');
const User         = require('../models/User');

// ── Helper: create notification silently ──────────────────────────────────────
const notify = async (userId, type, title, message) => {
  try { await Notification.create({ user: userId, type, title, message }); } catch {}
};

// ── Helper: derive slotType from time string (e.g. "14:00" → "Afternoon") ────
function deriveSlotType(time) {
  if (!time) return 'Morning';
  const [hourStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

// POST /api/v1/appointments — Book a new appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, patientName, date, time, type, slotType, notes } = req.body;
    const patientId = req.user.id; // from authMiddleware

    if (!doctorId || !date || !time) {
      return res.status(400).json({ success: false, message: 'doctorId, date and time are required.' });
    }

    // Verify the doctor user exists and has the 'doctor' role
    const doctorUser = await User.findById(doctorId);
    if (!doctorUser || doctorUser.role !== 'doctor') {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID. Please select a valid doctor.' });
    }

    // Resolve display name: use provided patientName or fetch from user record
    const displayName = patientName || req.user.name;

    // Auto-derive slotType from time if not explicitly provided
    const resolvedSlotType = slotType || deriveSlotType(time);

    const appointment = await Appointment.create({
      doctor:      doctorId,
      patient:     patientId,
      patientName: displayName,
      date:        new Date(date),
      time,
      type:        type || 'Consultation',
      slotType:    resolvedSlotType,
      notes:       notes || '',
    });

    // Notify the doctor that a new appointment was booked
    await notify(
      doctorId,
      'appointment',
      '📅 New Appointment Booked',
      `${displayName} has booked a ${type || 'Consultation'} appointment on ${new Date(date).toLocaleDateString()} at ${time}.`
    );

    // Notify the patient that their booking was received
    await notify(
      patientId,
      'appointment',
      '✅ Appointment Request Sent',
      `Your appointment request has been sent to the doctor. You will be notified once it's confirmed.`
    );

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    console.error('bookAppointment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/appointments — Get appointments for the logged-in user
exports.getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const role   = req.user.role;

    let query = {};
    if (role === 'doctor')  query.doctor  = userId;
    if (role === 'patient') query.patient = userId;
    // admin gets all

    const appointments = await Appointment.find(query)
      .populate('doctor',  'name specialization')
      .populate('patient', 'name email')
      .sort({ date: 1 });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/appointments/:id/status — Update appointment status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const apt = await Appointment.findById(req.params.id)
      .populate('patient', 'name')
      .populate('doctor',  'name');

    if (!apt) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    const role = req.user.role;
    const uid  = req.user.id;

    // ── Ownership / permission check ──────────────────────────────────────────
    if (role === 'patient') {
      // Patients can only cancel their own pending appointments
      if (apt.patient?._id?.toString() !== uid) {
        return res.status(403).json({ success: false, message: 'Not authorized to modify this appointment.' });
      }
      if (status !== 'Cancelled') {
        return res.status(403).json({ success: false, message: 'Patients can only cancel appointments.' });
      }
    } else if (role === 'doctor') {
      // Doctors can only update their own appointments
      if (apt.doctor?._id?.toString() !== uid) {
        return res.status(403).json({ success: false, message: 'Not authorized to modify this appointment.' });
      }
      // Doctors cannot cancel via this route (they use confirm/complete)
      if (status === 'Pending') {
        return res.status(403).json({ success: false, message: 'Doctors cannot revert to Pending status.' });
      }
    }
    // Admin has no restrictions

    apt.status = status;
    await apt.save();

    // ── Send notifications on status changes ──────────────────────────────────
    const aptDate = new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (role === 'doctor' || role === 'admin') {
      // Notify patient when doctor confirms / completes / cancels
      if (apt.patient?._id) {
        const messages = {
          Confirmed:  `✅ Your appointment on ${aptDate} at ${apt.time} has been confirmed by ${apt.doctor?.name || 'the doctor'}.`,
          Completed:  `🎉 Your appointment on ${aptDate} has been marked as completed. Thank you for visiting!`,
          Cancelled:  `❌ Your appointment on ${aptDate} at ${apt.time} was cancelled. Please rebook if needed.`,
        };
        const titles = {
          Confirmed: '✅ Appointment Confirmed',
          Completed: '🎉 Appointment Completed',
          Cancelled: '❌ Appointment Cancelled',
        };
        if (messages[status]) {
          await notify(apt.patient._id.toString(), 'appointment', titles[status], messages[status]);
        }
      }
    }

    if (role === 'patient') {
      // Notify doctor when patient cancels
      if (apt.doctor?._id) {
        await notify(
          apt.doctor._id.toString(),
          'appointment',
          '❌ Appointment Cancelled by Patient',
          `${apt.patientName} has cancelled their appointment on ${aptDate} at ${apt.time}.`
        );
      }
    }

    const updated = await Appointment.findById(apt._id)
      .populate('doctor',  'name specialization')
      .populate('patient', 'name email');

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('updateStatus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
