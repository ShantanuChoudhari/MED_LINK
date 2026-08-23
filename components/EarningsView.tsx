
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Clock, RefreshCw, ArrowUpRight } from 'lucide-react';
import { appointmentApi, doctorApi } from '../services/api';

const DEFAULT_FEE = 150; // fallback per-appointment fee

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400'   },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  green:  { bg: 'bg-green-50 dark:bg-green-900/30',  text: 'text-green-600 dark:text-green-400'  },
  slate:  { bg: 'bg-slate-50 dark:bg-slate-800',  text: 'text-slate-600 dark:text-slate-400'  },
};

const EarningsView: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [profile,      setProfile]      = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aptsRes, profileRes] = await Promise.all([
        appointmentApi.getAll(),
        doctorApi.getProfile(),
      ]);
      setAppointments(aptsRes.data || []);
      setProfile(profileRes.data || null);
    } catch {
      setAppointments([]);
    } finally { setLoading(false); }
  };

  const fee = profile?.fees || DEFAULT_FEE;

  const confirmed  = appointments.filter(a => a.status === 'Confirmed' || a.status === 'Completed');
  const pending    = appointments.filter(a => a.status === 'Pending');
  const totalEarned= confirmed.length  * fee;
  const pendingAmt = pending.length    * fee;

  const transactions = appointments.map(a => ({
    id:      a._id,
    patient: a.patientName || 'Unknown',
    date:    new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    amount:  fee,
    status:  a.status === 'Confirmed' || a.status === 'Completed' ? 'Cleared' :
             a.status === 'Pending'   ? 'Pending'  : 'Cancelled',
    type:    a.type || 'Consultation',
  }));

  const stats = [
    { label: 'Total Revenue',   value: `$${totalEarned.toFixed(2)}`, icon: DollarSign, color: 'blue',    trend: `${confirmed.length} confirmed`  },
    { label: 'Pending Payout',  value: `$${pendingAmt.toFixed(2)}`,  icon: Clock,      color: 'orange',  trend: `${pending.length} pending`      },
    { label: 'Net Revenue',     value: `$${(totalEarned * 0.8).toFixed(2)}`, icon: TrendingUp, color: 'green', trend: 'After 20% platform fee' },
  ];

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-top-4">
          {toast}
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Earnings & Revenue</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Consultation fee: <strong className="text-slate-700 dark:text-slate-200">${fee}</strong>/visit</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700">
            <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
          <button
            onClick={() => showToast(`✅ Payout request of $${(totalEarned * 0.8).toFixed(2)} submitted successfully!`)}
            className="bg-slate-900 dark:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-600 dark:hover:bg-blue-700 transition shadow-lg shadow-slate-200 dark:shadow-none text-sm"
          >
            Withdraw Funds
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />)
        ) : (
          stats.map((s, i) => {
            const cls = COLOR_CLASSES[s.color] || COLOR_CLASSES.slate;
            return (
              <div key={i} className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <div className={`w-12 h-12 ${cls.bg} ${cls.text} rounded-2xl flex items-center justify-center mb-4`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{s.label}</p>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{s.value}</h2>
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-slate-500">
                  <ArrowUpRight className="w-3 h-3" />{s.trend}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
        <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">Transaction History</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">{transactions.length} total</span>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No transactions yet. Appointments will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                <tr>
                  {['Patient', 'Date', 'Type', 'Amount', 'Status'].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{t.patient}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{t.date}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{t.type}</td>
                    <td className="px-6 py-4 font-black text-slate-900 dark:text-white">${t.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        t.status === 'Cleared'   ? 'bg-green-100 text-green-700'  :
                        t.status === 'Pending'   ? 'bg-orange-100 text-orange-700':
                                                   'bg-red-100 text-red-600'
                      }`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EarningsView;