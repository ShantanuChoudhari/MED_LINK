
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import Layout from './components/Layout';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import Telemedicine from './components/Telemedicine';
import DoctorSearch from './components/DoctorSearch';
import AppointmentsView from './components/AppointmentsView';
import MedicalHistoryView from './components/MedicalHistoryView';
import MyPatients from './components/MyPatients';
import EarningsView from './components/EarningsView';
import AdminAnalytics from './components/AdminAnalytics';
import ManageHospitals from './components/ManageHospitals';
import UserRoles from './components/UserRoles';
import PrescriptionsView from './components/PrescriptionsView';
import DoctorProfileEdit from './components/DoctorProfileEdit';
import { authApi } from './services/api';
import {
  Stethoscope, ShieldCheck, User as UserIcon,
  ChevronRight, Eye, EyeOff, LogIn, UserPlus, Activity,
} from 'lucide-react';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Map backend lowercase role → frontend UserRole enum
const toUserRole = (r: string): UserRole => {
  if (r === 'admin')  return UserRole.ADMIN;
  if (r === 'doctor') return UserRole.DOCTOR;
  return UserRole.PATIENT;
};

type AuthMode = 'demo' | 'login' | 'register';

const App: React.FC = () => {
  const [user,        setUser]        = useState<User | null>(null);
  const [activeTab,   setActiveTab]   = useState('dashboard');
  const [authMode,    setAuthMode]    = useState<AuthMode>('demo');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [showPwd,     setShowPwd]     = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'patient',
  });

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('medlink_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  const persistUser = (backendUser: any) => {
    const u: User = {
      id:    backendUser._id,
      name:  backendUser.name,
      email: backendUser.email,
      role:  toUserRole(backendUser.role),
    };
    setUser(u);
    localStorage.setItem('medlink_user', JSON.stringify(u));
  };

  // ── Demo quick-login ─────────────────────────────────────────────────────────
  const demoLogin = async (role: UserRole) => {
    setLoading(true); setError('');
    const emailMap: Record<UserRole, string> = {
      [UserRole.PATIENT]: 'patient@demo.com',
      [UserRole.DOCTOR]:  'doctor@demo.com',
      [UserRole.ADMIN]:   'admin@demo.com',
      [UserRole.STAFF]:   'admin@demo.com',
    };
    const email = emailMap[role];
    try {
      // Try login with demo creds (seeded by npm run seed)
      const res = await authApi.login(email, 'DemoPass@123');
      persistUser(res.user);
    } catch (err: any) {
      setError('Demo accounts not found. Please run: cd backend && npm run seed');
    } finally { setLoading(false); }
  };

  // ── Real Login ───────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await authApi.login(formData.email, formData.password);
      persistUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  // ── Real Register ────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await authApi.register(
        formData.name, formData.email, formData.password, formData.role
      );
      persistUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setActiveTab('dashboard');
    localStorage.removeItem('medlink_user');
  };

  // ── Content Router ───────────────────────────────────────────────────────────
  const renderContent = () => {
    if (!user) return null;
    if (activeTab === 'dashboard') {
      switch (user.role) {
        case UserRole.PATIENT: return <PatientDashboard user={user} />;
        case UserRole.DOCTOR:  return <DoctorDashboard  user={user} />;
        case UserRole.ADMIN:   return <AdminDashboard   user={user} setActiveTab={setActiveTab} />;
      }
    }
    switch (activeTab) {
      case 'search':                       return <DoctorSearch />;
      case 'telemedicine': case 'calls':   return <Telemedicine user={user} />;
      case 'appointments': case 'schedule':return <AppointmentsView user={user} />;
      case 'patients':                     return <MyPatients setActiveTab={setActiveTab} />;
      case 'earnings':                     return <EarningsView />;
      case 'analytics':                    return <AdminAnalytics />;
      case 'records':                      return <MedicalHistoryView />;
      case 'hospitals':                    return <ManageHospitals />;
      case 'staff':                        return <UserRoles />;
      case 'prescriptions':                return <PrescriptionsView user={user} />;
      case 'profile-edit':                 return <DoctorProfileEdit />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-950 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
            <Stethoscope className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Coming Soon</p>
            <p className="text-sm">The <strong>{activeTab}</strong> module will be available soon.</p>
          </div>
        );
    }
  };

  // ── Login Screen ─────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/30 mb-4">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">MedLink <span className="text-blue-400">AI</span></h1>
            <p className="text-slate-400 mt-1 text-sm">Next-generation healthcare ecosystem</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-6">
              {(['demo', 'login', 'register'] as AuthMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setAuthMode(m); setError(''); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                    authMode === m
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'demo' ? '⚡ Quick Demo' : m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* ── Demo Mode ── */}
            {authMode === 'demo' && (
              <div className="space-y-3">
                <p className="text-slate-400 text-xs mb-4 text-center">
                  One-click access. Make sure you've run <code className="bg-white/10 px-1 rounded text-blue-300">npm run seed</code> in the backend.
                </p>
                {[
                  { role: UserRole.PATIENT, label: 'Patient View',           sub: 'patient@demo.com', icon: UserIcon,    grad: 'from-blue-600 to-blue-700'   },
                  { role: UserRole.DOCTOR,  label: 'Doctor Workspace',        sub: 'doctor@demo.com',  icon: Stethoscope, grad: 'from-indigo-600 to-indigo-700'},
                  { role: UserRole.ADMIN,   label: 'Admin Control Panel',     sub: 'admin@demo.com',   icon: ShieldCheck, grad: 'from-slate-700 to-slate-800'  },
                ].map(item => (
                  <button
                    key={item.role}
                    disabled={loading}
                    onClick={() => demoLogin(item.role)}
                    className={`w-full group flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${item.grad} hover:opacity-90 transition-all duration-300 disabled:opacity-40 shadow-lg`}
                  >
                    <div className="p-2 bg-white/20 rounded-xl">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-white text-sm">{item.label}</p>
                      <p className="text-white/60 text-xs">{item.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            )}

            {/* ── Login Form ── */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email" required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'} required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/30">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In</>}
                </button>
              </form>
            )}

            {/* ── Register Form ── */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Full Name</label>
                  <input type="text" required placeholder="Alice Johnson"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Email</label>
                  <input type="email" required placeholder="you@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} required placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">I am a...</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="patient" className="bg-slate-800">Patient</option>
                    <option value="doctor"  className="bg-slate-800">Doctor</option>
                  </select>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/30">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" /> Create Account</>}
                </button>
              </form>
            )}
          </div>
          <p className="text-center text-slate-500 text-xs mt-4">
            Demo password: <span className="text-slate-400 font-mono">DemoPass@123</span>
          </p>
        </div>

        {/* Full-screen loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="font-bold text-slate-900 text-sm">Authenticating...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Layout user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout}>
      {renderContent()}
    </Layout>
  );
};

export default App;
