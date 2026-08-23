// src/routes/adminRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getStats,
  getDoctors, addDoctor, deleteDoctor,
  getHospitals, addHospital, deleteHospital,
  getUsers, updateUserRole,
  getHealth,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require auth + admin role
router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', getStats);                          // GET  /api/v1/admin/dashboard
router.get('/health',    getHealth);                         // GET  /api/v1/admin/health

// Doctors
router.get('/doctors',       getDoctors);                    // GET  /api/v1/admin/doctors
router.post('/doctors',      addDoctor);                     // POST /api/v1/admin/doctors
router.delete('/doctors/:id', deleteDoctor);                 // DEL  /api/v1/admin/doctors/:id

// Hospitals
router.get('/hospitals',        getHospitals);               // GET  /api/v1/admin/hospitals
router.post('/hospitals',       addHospital);                // POST /api/v1/admin/hospitals
router.delete('/hospitals/:id', deleteHospital);             // DEL  /api/v1/admin/hospitals/:id

// Users
router.get('/users',               getUsers);                // GET   /api/v1/admin/users
router.patch('/users/:id/role',    updateUserRole);          // PATCH /api/v1/admin/users/:id/role

module.exports = router;