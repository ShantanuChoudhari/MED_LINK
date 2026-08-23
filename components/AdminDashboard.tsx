
import React, { useState, useEffect } from 'react';
import { Building2, UserCheck, CreditCard, Calendar, Plus, Trash2, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { adminApi } from '../services/api';
import { User } from '../types';

interface Props { user: User; setActiveTab: (tab: string) => void; }

const REVENUE_PIE = [
  { name: 'Subscription', value: 45 },
  { name: 'Commission',   value: 35 },
  { name: 'Ads',          value: 20 },
];
const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];

const LINK_COLORS: Record<string, { bg: string, border: string, title: string, desc: string, link: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-900/30', title: 'text-blue-900 dark:text-blue-100', desc: 'text-blue-600 dark:text-blue-300', link: 'text-blue-700 dark:text-blue-400' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-900/30', title: 'text-indigo-900 dark:text-indigo-100', desc: 'text-indigo-600 dark:text-indigo-300', link: 'text-indigo-700 dark:text-indigo-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-900/30', title: 'text-emerald-900 dark:text-emerald-100', desc: 'text-emerald-600 dark:text-emerald-300', link: 'text-emerald-700 dark:text-emerald-400' },
};

const AdminDashboard: React.FC<Props> = ({ user, setActiveTab }) => {
  const [stats,    setStats]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState('');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDashboard();
      setStats(res.data?.stats || []);
    } catch {
      setStats([
        { label: 'Active Doctors',      value: '—', trend: '' },
        { label: 'Registered Users',    value: '—', trend: '' },
        { label: 'Total Appointments',  value: '—', trend: '' },
        { label: 'Hospitals',           value: '—', trend: '' },
      ]);
    } finally { setLoading(false); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const statIcons = [UserCheck, Building2, Calendar, CreditCard];

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl text-sm font-medium">{toast}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Admin Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Welcome back, {user.name}</p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)
        ) : (
          stats.map((s, i) => {
            const Icon = statIcons[i] || Building2;
            return (
              <div key={i} className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400"><Icon className="w-5 h-5" /></div>
                  {s.trend && (
                    <span className={`text-xs font-bold ${s.trend.startsWith('+') ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'} px-2 py-0.5 rounded-full`}>
                      {s.trend}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{s.label}</p>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{s.value}</h4>
              </div>
            );
          })
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Platform Growth (Appointments)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { month: 'Jan', appointments: 40 }, { month: 'Feb', appointments: 62 },
                { month: 'Mar', appointments: 55 }, { month: 'Apr', appointments: 80 },
                { month: 'May', appointments: 72 }, { month: 'Jun', appointments: 95 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#000' }} />
                <Bar dataKey="appointments" fill="#3b82f6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Revenue Sources</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={REVENUE_PIE} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {REVENUE_PIE.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {REVENUE_PIE.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-slate-600 dark:text-slate-300">{e.name}</span>
                </div>
                <span className="font-bold dark:text-white">{e.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Manage Hospitals', desc: 'Add or remove healthcare facilities', tab: 'hospitals', color: 'blue' },
          { label: 'User Roles',       desc: 'Control access and permissions',       tab: 'staff',     color: 'indigo' },
          { label: 'System Analytics', desc: 'Platform health and activity logs',    tab: 'analytics', color: 'emerald' },
        ].map((item, i) => {
          const cls = LINK_COLORS[item.color] || LINK_COLORS.blue;
          return (
            <div key={i} className={`${cls.bg} border ${cls.border} p-5 rounded-2xl`}>
              <h4 className={`font-bold ${cls.title} mb-1`}>{item.label}</h4>
              <p className={`${cls.desc} text-xs mb-3`}>{item.desc}</p>
              <button
                onClick={() => setActiveTab(item.tab)}
                className={`text-xs font-bold ${cls.link} hover:underline`}
              >
                Go → {item.tab}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
