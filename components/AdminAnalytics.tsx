
import React, { useState, useEffect } from 'react';
import { Activity, Users, Building2, TrendingUp, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { adminApi } from '../services/api';

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-600 dark:text-blue-400'    },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/20',  text: 'text-indigo-600 dark:text-indigo-400'  },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
  slate:   { bg: 'bg-slate-50 dark:bg-slate-800',   text: 'text-slate-600 dark:text-slate-400'   },
};

const AdminAnalytics: React.FC = () => {
  const [stats,   setStats]   = useState<any>(null);
  const [health,  setHealth]  = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dashRes, hospitalsRes, usersRes, healthRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getHospitals(),
        adminApi.getUsers(),
        adminApi.getHealth(),
      ]);
      setStats({
        dashboard:  dashRes.data?.stats || [],
        hospitals:  hospitalsRes.data?.length || 0,
        users:      usersRes.data?.length || 0,
        doctors:    (usersRes.data || []).filter((u: any) => u.role === 'doctor').length,
        patients:   (usersRes.data || []).filter((u: any) => u.role === 'patient').length,
      });
      setHealth(healthRes.data);
    } catch {
      setStats(null);
      setHealth(null);
    }
    finally { setLoading(false); }
  };

  const systemLogs = [
    { event: 'Server Running',          detail: `Express API active — Uptime: ${health ? Math.floor(health.uptime) : 0}s`, status: health?.api === 'OK' ? 'success' : 'info' },
    { event: 'MongoDB Status',          detail: `Database state: ${health ? health.db : 'Disconnected'}`, status: health?.db === 'OK' ? 'success' : 'info' },
    { event: 'Gemini AI Integration',    detail: `gemini-3.5-flash: ${health ? health.gemini : 'Missing'}`, status: health?.gemini === 'OK' ? 'success' : 'info' },
    { event: 'Socket.IO Server',         detail: `WebRTC signaling channel: ${health ? health.socket : 'Offline'}`, status: health?.socket === 'OK' ? 'success' : 'info' },
    { event: 'JWT Auth Middleware',      detail: '30-day token expiry configured',        status: 'info'    },
  ];

  const globalStats = stats ? [
    { label: 'Total Users',     value: stats.users,   icon: Users,     color: 'blue'    },
    { label: 'Doctors',         value: stats.doctors, icon: Activity,  color: 'indigo'  },
    { label: 'Hospitals',       value: stats.hospitals,icon: Building2, color: 'emerald' },
    { label: 'Platform Uptime', value: '99.9%',       icon: TrendingUp, color: 'slate'  },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">System Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Live platform performance and health</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)
        ) : (
          globalStats.map((s, i) => {
            const cls = COLOR_CLASSES[s.color] || COLOR_CLASSES.slate;
            return (
              <div key={i} className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <div className={`w-11 h-11 ${cls.bg} ${cls.text} rounded-2xl flex items-center justify-center mb-3`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.label}</p>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{s.value}</h2>
              </div>
            );
          })
        )}
      </div>

      {/* System Health + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">System Activity Logs</h3>
          <div className="space-y-5">
            {systemLogs.map((log, i) => (
              <div key={i} className="flex gap-4">
                <div className={`mt-0.5 p-2 rounded-lg ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'} flex-shrink-0`}>
                  {log.status === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{log.event}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{log.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
          <h3 className="font-bold text-lg mb-5">Infrastructure Health</h3>
          <div className="space-y-3">
            {health ? (
              [
                { service: 'API Server',             status: health.api },
                { service: 'Video Relay (Socket.IO)', status: health.socket },
                { service: 'MongoDB',                 status: health.db },
                { service: 'Gemini AI',               status: health.gemini },
                { service: 'Auth (JWT)',              status: 'OK' }
              ].map(s => (
                <div key={s.service} className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-sm font-medium text-slate-300">{s.service}</span>
                  <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${s.status === 'OK' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <div className={`w-1.5 h-1.5 ${s.status === 'OK' ? 'bg-emerald-400' : 'bg-amber-400'} rounded-full animate-pulse`} />
                    {s.status}
                  </span>
                </div>
              ))
            ) : (
              ['API Server', 'Video Relay (Socket.IO)', 'MongoDB', 'Gemini AI', 'Auth (JWT)'].map(service => (
                <div key={service} className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-sm font-medium text-slate-300">{service}</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400">
                    Offline
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;