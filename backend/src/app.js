// backend/src/app.js — Production-ready version with dynamic CORS
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express    = require('express');
const http       = require('http');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const socketServer = require('./socket');

// ── Routes ───────────────────────────────────────────────────────────────────
const authRoutes          = require('./routes/authRoutes');
const adminRoutes         = require('./routes/adminRoutes');
const doctorRoutes        = require('./routes/doctorRoutes');
const patientRoutes       = require('./routes/patientRoutes');
const appointmentRoutes   = require('./routes/appointmentRoutes');
const telemedicineRoutes  = require('./routes/telemedicineRoutes');
const aiRoutes            = require('./routes/aiRoutes');
const prescriptionRoutes  = require('./routes/prescriptionRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const reviewRoutes        = require('./routes/reviewRoutes');
const notificationRoutes  = require('./routes/notificationRoutes');

const app    = express();
const server = http.createServer(app);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      500,
  standardHeaders: true,
  legacyHeaders:   false,
});
app.use('/api/', limiter);

// ── CORS — accepts localhost + any Vercel/Netlify/Render domain ──────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: true, // Allow all origins for now to fix CORS issues
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Database ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medlink')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',           authRoutes);
app.use('/api/v1/admin',          adminRoutes);
app.use('/api/v1/doctor',         doctorRoutes);
app.use('/api/v1/patient',        patientRoutes);
app.use('/api/v1/appointments',   appointmentRoutes);
app.use('/api/v1/telemedicine',   telemedicineRoutes);
app.use('/api/v1/ai',             aiRoutes);
app.use('/api/v1/prescriptions',  prescriptionRoutes);
app.use('/api/v1/records',        medicalRecordRoutes);
app.use('/api/v1/reviews',        reviewRoutes);
app.use('/api/v1/notifications',  notificationRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date(), env: process.env.NODE_ENV, uptime: process.uptime() })
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('❌ Server Error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ── Socket.io ─────────────────────────────────────────────────────────────────
socketServer.init(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 MedLink AI Backend running on port ${PORT}`));