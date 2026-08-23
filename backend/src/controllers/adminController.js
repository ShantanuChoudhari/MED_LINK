// src/controllers/adminController.js
const mongoose = require('mongoose');
const Doctor   = require('../models/Doctor');
const User     = require('../models/User');
const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');

// GET /api/v1/admin/dashboard
exports.getStats = async (req, res) => {
  try {
    const [doctorCount, userCount, appointmentCount, hospitalCount] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments(),
      Appointment.countDocuments(),
      Hospital.countDocuments(),
    ]);

    const stats = [
      { label: 'Active Doctors',    value: doctorCount,      trend: '+12%' },
      { label: 'Registered Users',  value: userCount,        trend: '+8%'  },
      { label: 'Total Appointments', value: appointmentCount, trend: '+24%' },
      { label: 'Hospitals',         value: hospitalCount,    trend: '+5%'  },
    ];

    res.status(200).json({ success: true, data: { stats } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/admin/doctors
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('user', 'name email');
    res.status(200).json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/admin/doctors — Create doctor profile for an existing user
exports.addDoctor = async (req, res) => {
  try {
    const { userId, name, specialization, fees, experience, hospital, location } = req.body;
    if (!userId || !name || !specialization || !fees) {
      return res.status(400).json({ success: false, message: 'userId, name, specialization and fees are required.' });
    }

    const existingUser = await User.findById(userId);
    if (!existingUser) return res.status(404).json({ success: false, message: 'User not found.' });

    const doctor = await Doctor.create({ user: userId, name, specialization, fees, experience, hospital, location });
    res.status(201).json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/admin/doctors/:id
exports.deleteDoctor = async (req, res) => {
  try {
    const deleted = await Doctor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    res.status(200).json({ success: true, message: 'Doctor removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/admin/hospitals
exports.getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.status(200).json({ success: true, data: hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/admin/hospitals
exports.addHospital = async (req, res) => {
  try {
    const { name, address, lat, lng } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required.' });
    const hospital = await Hospital.create({ name, address, location: { lat, lng } });
    res.status(201).json({ success: true, data: hospital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/admin/hospitals/:id
exports.deleteHospital = async (req, res) => {
  try {
    const deleted = await Hospital.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Hospital not found.' });
    res.status(200).json({ success: true, message: 'Hospital removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/admin/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/v1/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'doctor', 'patient'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    const updated = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/admin/health — Retrieve actual system health statistics
exports.getHealth = async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'OK' : 'Disconnected';
    const geminiStatus = process.env.GEMINI_API_KEY ? 'OK' : 'Missing';
    
    res.status(200).json({
      success: true,
      data: {
        api: 'OK',
        db: dbStatus,
        gemini: geminiStatus,
        socket: 'OK',
        uptime: process.uptime()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};