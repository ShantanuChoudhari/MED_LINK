
import React, { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { doctorApi } from '../services/api';
import { User } from '../types';

interface Props { user: User; }

const COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const DoctorDashboard: React.FC<Props> = ({ user }) => {
  const [data,        setData]        = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState('');
  const [updatingId,  setUpdatingId]  = useState<string | null>(null);

  useEffect(() => { 
    fetchDashboard(true);
    const interval = setInterval(() => fetchDashboard(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await doctorApi.getDashboard();
      setData(res.data);
    } catch {
      // Fallback demo data when no appointments exist yet
      setData({
        stats: { totalPatients: 0, todayAppointments: 0, satisfaction: '—', earnings: '$0' },
        appointments: [],
        revenueChart: [
          { name: 'Mon', amount: 0 }, { name: 'Tue', amount: 0 },
          { name: 'Wed', amount: 0 }, { name: 'Thu', amount: 0 },
          { name: 'Fri', amount: 0 },
        ],
        scheduleOverview: [
          { label: 'Morning Slots', used: 0, total: 6 },
          { label: 'Afternoon Slots', used: 0, total: 8 },
          { label: 'Evening Slots', used: 0, total: 4 },
        ],
      });
    } finally { if (showLoading) setLoading(false); }
  };

  const changeStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      // Use doctor-specific endpoint which validates ownership + sends patient notifications
      await doctorApi.updateAppointmentStatus(id, status);
      showToast(`✅ Appointment ${status.toLowerCase()}`);
      fetchDashboard(false);
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally { setUpdatingId(null); }
  };

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 3500);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-6">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}</div>
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Patients',       value: data?.stats?.totalPatients     || 0, icon: Users,      color: 'blue'    },
    { label: "Today's Appointments", value: data?.stats?.todayAppointments || 0, icon: Calendar,   color: 'indigo'  },
    { label: 'Satisfaction',          value: data?.stats?.satisfaction      || '—', icon: TrendingUp, color: 'green' },
    { label: 'Monthly Earnings',     value: data?.stats?.earnings          || '$0', icon: DollarSign, color: 'emerald'},
  ];

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${COLOR_CLASSES[s.color] || COLOR_CLASSES.blue}`}>
                <s.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{s.label}</p>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{s.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Patient Flow This Week</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenueChart || []}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Appointments */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Today's Appointments</h3>
              <button onClick={() => fetchDashboard(false)} className="text-xs text-blue-600 font-semibold hover:underline">Refresh</button>
            </div>
            {(!data?.appointments || data.appointments.length === 0) ? (
              <div className="py-12 text-center text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No appointments today</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {data.appointments.map((apt: any) => (
                  <div key={apt._id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                        {apt.patientName?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{apt.patientName}</p>
                        <p className="text-xs text-slate-400">{apt.type} · {apt.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {apt.status === 'Pending' ? (
                        <>
                          <button disabled={updatingId === apt._id}
                            onClick={() => changeStatus(apt._id, 'Cancelled')}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition" title="Cancel">
                            <XCircle className="w-5 h-5" />
                          </button>
                          <button disabled={updatingId === apt._id}
                            onClick={() => changeStatus(apt._id, 'Confirmed')}
                            className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition" title="Confirm">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        </>
                      ) : apt.status === 'Confirmed' ? (
                        <button disabled={updatingId === apt._id}
                          onClick={() => changeStatus(apt._id, 'Completed')}
                          className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition">
                          Mark Completed
                        </button>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          apt.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                          apt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>{apt.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Schedule Overview</h3>
            <div className="space-y-4">
              {(data?.scheduleOverview || []).map((item: any, i: number) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-bold text-slate-900">{item.used}/{item.total}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-700"
                      style={{ width: item.total > 0 ? `${(item.used / item.total) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl text-white">
            <h4 className="font-bold mb-2">Welcome, {user.name}</h4>
            <p className="text-indigo-100 text-sm mb-4">
              {data?.stats?.todayAppointments || 0} appointment(s) today. Keep up the great work!
            </p>
            <button onClick={() => fetchDashboard(false)}
              className="w-full py-2.5 bg-white text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-50 transition">
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
