// src/controllers/doctorController.js
const Appointment  = require('../models/Appointment');
const Doctor       = require('../models/Doctor');
const Notification = require('../models/Notification');

// ── Helper: create notification silently ──────────────────────────────────────
const notify = async (userId, type, title, message) => {
  try { await Notification.create({ user: userId, type, title, message }); } catch {}
};

// GET /api/v1/doctor/dashboard
exports.getDashboardData = async (req, res) => {
  try {
    const doctorId = req.user.id; // From authMiddleware

    // Today's date range (midnight to end of day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch ALL appointments for this doctor (populated)
    const appointments = await Appointment.find({ doctor: doctorId })
      .populate('patient', 'name email')
      .sort({ date: 1 });

    const todayAppointments = appointments.filter(a => {
      const d = new Date(a.date);
      return d >= todayStart && d <= todayEnd;
    });

    // Count unique patients (by patient ObjectId or patientName fallback)
    const uniquePatients = new Set(
      appointments.map(a => (a.patient ? a.patient._id.toString() : a.patientName))
    );

    // Revenue chart — last 7 days (grouped by day of week)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenueByDay = {};
    days.forEach(d => { revenueByDay[d] = 0; });

    // Count completed appointments per day for this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    appointments
      .filter(a => a.status === 'Completed' && new Date(a.date) >= oneWeekAgo)
      .forEach(a => {
        const dayName = days[new Date(a.date).getDay()];
        revenueByDay[dayName] = (revenueByDay[dayName] || 0) + 1;
      });

    const revenueChart = days.map(name => ({
      name,
      amount: revenueByDay[name] * 100, // mock: $100 per completed appointment
    }));

    // Schedule overview
    const morning   = appointments.filter(a => a.slotType === 'Morning');
    const afternoon = appointments.filter(a => a.slotType === 'Afternoon');
    const evening   = appointments.filter(a => a.slotType === 'Evening');

    const scheduleOverview = [
      { label: 'Morning Slots',   used: morning.length,   total: 6 },
      { label: 'Afternoon Slots', used: afternoon.length, total: 8 },
      { label: 'Evening Slots',   used: evening.length,   total: 4 },
    ];

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalPatients:     uniquePatients.size,
          todayAppointments: todayAppointments.length,
          satisfaction:      '98%',
          earnings:          `$${appointments.filter(a => a.status === 'Completed').length * 100}`,
        },
        appointments:    todayAppointments.slice(0, 10), // top 10 today
        revenueChart,
        scheduleOverview,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/doctor/appointments/:id/status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const apt = await Appointment.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor',  'name');

    if (!apt) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    // Ensure this doctor owns the appointment
    if (apt.doctor?._id?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this appointment.' });
    }

    apt.status = status;
    await apt.save();

    // ── Notify patient of status change ──────────────────────────────────────
    if (apt.patient?._id) {
      const aptDate = new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const messages = {
        Confirmed: `✅ Your appointment on ${aptDate} at ${apt.time} has been confirmed by ${req.user.name}.`,
        Completed: `🎉 Your appointment on ${aptDate} has been completed. Thank you for your visit!`,
        Cancelled: `❌ Your appointment on ${aptDate} at ${apt.time} was cancelled by your doctor. Please rebook.`,
      };
      const titles = {
        Confirmed: '✅ Appointment Confirmed',
        Completed: '🎉 Appointment Completed',
        Cancelled: '❌ Appointment Cancelled by Doctor',
      };
      if (messages[status]) {
        await notify(apt.patient._id.toString(), 'appointment', titles[status], messages[status]);
      }
    }

    const updated = await Appointment.findById(apt._id)
      .populate('patient', 'name email')
      .populate('doctor',  'name specialization');

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/doctor/patients — all unique patients
exports.getMyPatients = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const appointments = await Appointment.find({ doctor: doctorId })
      .populate('patient', 'name email')
      .sort({ date: -1 });

    // Deduplicate patients, keep most recent appointment info
    const seen = new Set();
    const patients = [];
    for (const apt of appointments) {
      const pid = apt.patient?._id?.toString() || apt.patientName;
      if (!seen.has(pid)) {
        seen.add(pid);
        patients.push({
          id:              pid,
          name:            apt.patient?.name        || apt.patientName,
          email:           apt.patient?.email       || 'N/A',
          lastVisit:       apt.date,
          appointmentType: apt.type,
          status:          apt.status,
        });
      }
    }

    res.status(200).json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/doctor/profile — Get own doctor profile
exports.getProfile = async (req, res) => {
  try {
    const profile = await Doctor.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/doctor/profile — Update own doctor profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, specialization, fees, experience, hospital, location, bio, availability, isAvailable } = req.body;
    const updateFields = {};
    if (name            !== undefined) updateFields.name           = name;
    if (specialization  !== undefined) updateFields.specialization = specialization;
    if (fees            !== undefined) updateFields.fees           = fees;
    if (experience      !== undefined) updateFields.experience     = experience;
    if (hospital        !== undefined) updateFields.hospital       = hospital;
    if (location        !== undefined) updateFields.location       = location;
    if (bio             !== undefined) updateFields.bio            = bio;
    if (availability    !== undefined) updateFields.availability   = availability;
    if (isAvailable     !== undefined) updateFields.isAvailable    = isAvailable;

    const profile = await Doctor.findOneAndUpdate(
      { user: req.user.id },
      updateFields,
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};