# MedLink AI — Advanced Healthcare Ecosystem

> A full-stack MERN telemedicine platform with AI-powered symptom analysis, real-time video consultations (WebRTC), appointment management, prescriptions, medical records, and role-based dashboards for Patients, Doctors, and Admins.

---

## ✨ Features

| Role | Capabilities |
|------|-------------|
| **Patient** | AI symptom analyzer, find & book doctors, view appointments, prescriptions, medical records, notifications |
| **Doctor** | Dashboard with today's schedule, confirm/cancel/complete appointments, prescribe medications, manage profile |
| **Admin** | Platform analytics, manage doctors, hospitals, users & roles |

- 🤖 **Gemini AI** — symptom-to-specialist routing with keyword fallback
- 📹 **WebRTC Telemedicine** — real-time video calls via Socket.io signaling
- 🔔 **Real-time Notifications** — automatic alerts for appointment status changes
- 🔐 **JWT Authentication** — role-based access control (Patient / Doctor / Admin)
- 📊 **Live Charts** — revenue & patient flow visualizations (Recharts)

---

## 🛠️ Tech Stack

**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Recharts + Socket.io-client  
**Backend:** Node.js + Express + MongoDB (Mongoose) + Socket.io + JWT  
**AI:** Google Gemini API (`gemini-1.5-flash`) with keyword fallback  
**Deployment:** Frontend → Vercel · Backend → Render · Database → MongoDB Atlas

---

## 🚀 Local Development

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongod`)
- A Google Gemini API key ([get one free](https://aistudio.google.com/app/apikey))

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/medlink-ai.git
cd medlink-ai

# Install frontend deps
npm install

# Install backend deps
cd backend && npm install && cd ..
```

### 2. Configure Environment Variables

**Frontend** — create `.env.local` in the project root:
```env
VITE_API_URL=http://localhost:5000/api/v1
GEMINI_API_KEY=your_gemini_api_key_here
```

**Backend** — create `backend/src/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/medlink
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Seed Demo Data

```bash
cd backend && npm run seed
```

Demo accounts created:
| Role | Email | Password |
|------|-------|----------|
| Patient | `patient@demo.com` | `DemoPass@123` |
| Doctor | `doctor@demo.com` | `DemoPass@123` |
| Admin | `admin@demo.com` | `DemoPass@123` |

### 4. Start Both Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
npm run dev
```

Open **http://localhost:3000**

---

## 🌐 Deployment

### Backend → Render (Free)

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/app.js`
4. Add Environment Variables in Render dashboard:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a strong random string
   - `GEMINI_API_KEY` — your Gemini key
   - `FRONTEND_URL` — your Vercel frontend URL (for CORS)
   - `NODE_ENV` — `production`

### Frontend → Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set **Framework Preset** to `Vite`
4. Add Environment Variables:
   - `VITE_API_URL` — your Render backend URL (e.g. `https://medlink-backend.onrender.com/api/v1`)
   - `GEMINI_API_KEY` — your Gemini key

### Database → MongoDB Atlas (Free)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free cluster
2. Whitelist `0.0.0.0/0` (all IPs) under Network Access
3. Create a database user, copy the connection string
4. Paste into Render as `MONGO_URI`
5. After deploying, run the seed: `node src/seed.js` locally pointing to Atlas

---

## 📁 Project Structure

```
medlink-ai/
├── backend/                 # Express API
│   └── src/
│       ├── controllers/     # Business logic
│       ├── models/          # Mongoose schemas
│       ├── routes/          # Express routers
│       ├── middleware/      # Auth middleware
│       ├── socket.js        # WebRTC signaling
│       ├── seed.js          # Demo data seeder
│       └── app.js           # Entry point
├── components/              # React components
├── services/                # API client (api.ts)
├── contexts/                # ThemeContext
├── types.ts                 # TypeScript interfaces
├── App.tsx                  # Root component + auth
└── index.tsx                # Entry point
```

---

## 📄 License
MIT
