// backend/src/seed.js — Full demo data seeder
// Run with: npm run seed

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User          = require('./models/User');
const Doctor        = require('./models/Doctor');
const Hospital      = require('./models/Hospital');
const Appointment   = require('./models/Appointment');
const Prescription  = require('./models/Prescription');
const MedicalRecord = require('./models/MedicalRecord');
const Notification  = require('./models/Notification');

const DEMO_PASSWORD = 'DemoPass@123';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medlink');
  console.log('✅ Connected to MongoDB');

  // Wipe all demo data
  await Promise.all([
    User.deleteMany({}),
    Doctor.deleteMany({}),
    Hospital.deleteMany({}),
    Appointment.deleteMany({}),
    Prescription.deleteMany({}),
    MedicalRecord.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ── Users ────────────────────────────────────────────────────────────────────
  const [adminUser, doctorUser1, doctorUser2, patientUser] = await User.insertMany([
    { name: 'Super Admin',      email: 'admin@demo.com',   password: hash, role: 'admin'   },
    { name: 'Dr. Sarah Connor', email: 'doctor@demo.com',  password: hash, role: 'doctor'  },
    { name: 'Dr. James Smith',  email: 'doctor2@demo.com', password: hash, role: 'doctor'  },
    { name: 'Alice Johnson',    email: 'patient@demo.com', password: hash, role: 'patient' },
  ]);
  console.log('👤 Created 4 users');

  // ── Hospitals ────────────────────────────────────────────────────────────────
  await Hospital.insertMany([
    { name: 'City Central Hospital',    address: '123 Broadway, New York',  location: { lat: 40.7128, lng: -74.0060 } },
    { name: 'St. Mary Medical Center',  address: '456 Times Sq, New York',  location: { lat: 40.7589, lng: -73.9851 } },
    { name: 'North Star Clinic',        address: '789 Park Ave, New York',  location: { lat: 40.7690, lng: -73.9820 } },
  ]);
  console.log('🏥 Created 3 hospitals');

  // ── Doctor Profiles ──────────────────────────────────────────────────────────
  await Doctor.insertMany([
    { user: doctorUser1._id, name: 'Dr. Sarah Connor', specialization: 'Cardiologist',   experience: 12, fees: 150, rating: 4.8, hospital: 'City Central Hospital',   location: 'New York', isAvailable: true, bio: 'Expert in non-invasive cardiology and preventative heart care.',        availability: ['09:00','10:00','14:00','15:00','16:00'] },
    { user: doctorUser2._id, name: 'Dr. James Smith',  specialization: 'Dermatologist',  experience: 8,  fees: 100, rating: 4.5, hospital: 'St. Mary Medical Center', location: 'New York', isAvailable: true, bio: 'Specializing in pediatric dermatology and laser treatments.',           availability: ['11:00','13:00','15:00','17:00'] },
    { user: doctorUser1._id, name: 'Dr. Elena Gilbert',specialization: 'Neurologist',    experience: 15, fees: 200, rating: 4.9, hospital: 'City Central Hospital',   location: 'New York', isAvailable: true, bio: 'Leading researcher in neuro-regenerative therapy.',                    availability: ['10:00','12:00','14:00'] },
    { user: doctorUser2._id, name: 'Dr. Marcus Lee',   specialization: 'Orthopedist',    experience: 10, fees: 175, rating: 4.7, hospital: 'North Star Clinic',       location: 'New York', isAvailable: true, bio: 'Specialist in sports medicine and joint replacement.',                availability: ['09:30','11:00','15:30'] },
    { user: doctorUser1._id, name: 'Dr. Priya Patel',  specialization: 'Pediatrician',   experience: 6,  fees: 80,  rating: 5.0, hospital: 'St. Mary Medical Center', location: 'New York', isAvailable: true, bio: 'Compassionate care for children from birth through adolescence.',     availability: ['08:30','10:30','13:00','16:00'] },
  ]);
  console.log('👨‍⚕️ Created 5 doctor profiles');

  // ── Appointments ─────────────────────────────────────────────────────────────
  const today    = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

  const [apt1, apt2, apt3] = await Appointment.insertMany([
    { doctor: doctorUser1._id, patient: patientUser._id, patientName: 'Alice Johnson', date: today,    time: '10:00', type: 'Consultation', status: 'Confirmed', slotType: 'Morning',   notes: 'Chest discomfort evaluation.' },
    { doctor: doctorUser1._id, patient: patientUser._id, patientName: 'Alice Johnson', date: tomorrow, time: '14:00', type: 'Video Call',   status: 'Pending',   slotType: 'Afternoon', notes: 'Follow-up video call.' },
    { doctor: doctorUser2._id, patient: patientUser._id, patientName: 'Alice Johnson', date: nextWeek, time: '11:00', type: 'Follow-up',    status: 'Completed', slotType: 'Morning',   notes: 'Skin condition review.' },
  ]);
  console.log('📅 Created 3 appointments');

  // ── Prescriptions ─────────────────────────────────────────────────────────────
  await Prescription.insertMany([
    {
      appointment: apt1._id,
      doctor:      doctorUser1._id,
      patient:     patientUser._id,
      patientName: 'Alice Johnson',
      diagnosis:   'Mild hypertension and cardiac stress',
      notes:       'Avoid caffeine. Follow up in 2 weeks.',
      medicines: [
        { name: 'Amlodipine',   dosage: '5mg',   frequency: 'Once daily',  duration: '30 days' },
        { name: 'Aspirin',      dosage: '75mg',  frequency: 'Once daily',  duration: '30 days' },
        { name: 'Metoprolol',   dosage: '25mg',  frequency: 'Twice daily', duration: '14 days' },
      ],
    },
    {
      appointment: apt3._id,
      doctor:      doctorUser2._id,
      patient:     patientUser._id,
      patientName: 'Alice Johnson',
      diagnosis:   'Eczema with secondary infection',
      notes:       'Keep affected area clean and dry.',
      medicines: [
        { name: 'Hydrocortisone Cream', dosage: '1%',  frequency: 'Twice daily', duration: '14 days' },
        { name: 'Cetirizine',           dosage: '10mg', frequency: 'Once daily',  duration: '7 days'  },
      ],
    },
  ]);
  console.log('💊 Created 2 prescriptions');

  // ── Medical Records ───────────────────────────────────────────────────────────
  await MedicalRecord.insertMany([
    { patient: patientUser._id, doctor: doctorUser1._id, title: 'ECG Report — Normal Sinus Rhythm',   category: 'Lab Results',  provider: 'City Central Hospital',   description: 'Electrocardiogram performed. No significant abnormalities detected. Mild ST changes noted.' },
    { patient: patientUser._id, doctor: doctorUser1._id, title: 'Cardiology Consultation Report',     category: 'Consultation', provider: 'Dr. Sarah Connor',         description: 'Initial consultation for chest pain. Recommended echo test and lifestyle changes.' },
    { patient: patientUser._id, doctor: doctorUser2._id, title: 'Dermatology Visit — Eczema',         category: 'Consultation', provider: 'St. Mary Medical Center', description: 'Diagnosed with atopic eczema. Prescribed topical steroids and antihistamines.' },
    { patient: patientUser._id, doctor: doctorUser2._id, title: 'Allergy Panel — Blood Test Results', category: 'Lab Results',  provider: 'North Star Clinic',       description: 'Elevated IgE levels. Positive for dust mites and tree pollen. Further immunotherapy recommended.' },
  ]);
  console.log('📋 Created 4 medical records');

  // ── Notifications ─────────────────────────────────────────────────────────────
  await Notification.insertMany([
    { user: patientUser._id, type: 'appointment',  title: '✅ Appointment Confirmed',    message: 'Your appointment with Dr. Sarah Connor on today at 10:00 has been confirmed.' },
    { user: patientUser._id, type: 'prescription', title: '💊 New Prescription Issued',  message: 'Dr. Sarah Connor has issued a prescription for Hypertension. View in Prescriptions.' },
    { user: patientUser._id, type: 'system',       title: '🎉 Welcome to MedLink AI!',   message: 'Your account is all set. Book appointments, consult doctors, and track your health.' },
    { user: doctorUser1._id, type: 'appointment',  title: '📅 New Appointment Booked',   message: 'Alice Johnson has booked an appointment for tomorrow at 14:00 (Video Call).' },
    { user: doctorUser1._id, type: 'system',       title: '✅ Profile Ready',             message: 'Your doctor profile is live. Patients can now find and book with you.' },
    { user: adminUser._id,   type: 'system',       title: '🔑 Admin Access Granted',     message: 'You are logged in as Super Admin. You have full platform management access.' },
  ]);
  console.log('🔔 Created 6 notifications');

  console.log('\n✅ Seed complete! Demo credentials:');
  console.log('   👤 Admin:   admin@demo.com   / DemoPass@123');
  console.log('   🩺 Doctor:  doctor@demo.com  / DemoPass@123');
  console.log('   🧑 Patient: patient@demo.com / DemoPass@123');
  console.log('\n📊 Seeded: 4 users | 5 doctors | 3 hospitals | 3 appointments | 2 prescriptions | 4 records | 6 notifications');

  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
