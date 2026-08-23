
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Plus, X, CheckCircle, XCircle } from 'lucide-react';
import { appointmentApi, patientApi } from '../services/api';
import { User, UserRole } from '../types';

interface Props { user: User; }

const AppointmentsView: React.FC<Props> = ({ user }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showBook,     setShowBook]     = useState(false);
  const [doctors,      setDoctors]      = useState<any[]>([]);
  const [form,         setForm]         = useState({ doctorId: '', date: '', time: '', type: 'Consultation', notes: '' });
  const [submitting,   setSubmitting]   = useState(false);
  const [toast,        setToast]        = useState('');

  useEffect(() => { 
    fetchAppointments(true); 
    const interval = setInterval(() => fetchAppointments(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAppointments = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await appointmentApi.getAll();
      setAppointments(res.data || []);
    } catch { setAppointments([]); }
    finally { if (showLoading) setLoading(false); }
  };

  const openBook = async () => {
    setShowBook(true);
    try {
      const res = await patientApi.searchDoctors();
      setDoctors(res.data || []);
    } catch {}
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doctorId || !form.date || !form.time) return;
    setSubmitting(true);
    try {
      await appointmentApi.book({ ...form, patientName: user.name });
      setShowBook(false);
      setForm({ doctorId: '', date: '', time: '', type: 'Consultation', notes: '' });
      showToast('✅ Appointment booked!');
      fetchAppointments(false);
    } catch (e: any) { showToast(`❌ ${e.message}`); }
    finally { setSubmitting(false); }
  };

  const changeStatus = async (id: string, status: string) => {
    if (status === 'Cancelled' && !confirm('Cancel this appointment?')) return;
    try {
      await appointmentApi.updateStatus(id, status);
      showToast(`Appointment ${status.toLowerCase()}.`);
      fetchAppointments(false);
    } catch (e: any) { showToast(`❌ ${e.message}`); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      Confirmed: 'bg-green-100 text-green-700',
      Pending:   'bg-amber-100 text-amber-700',
      Cancelled: 'bg-red-100 text-red-600',
      Completed: 'bg-slate-100 text-slate-600',
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl text-sm font-medium">{toast}</div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {user.role === UserRole.DOCTOR ? 'My Schedule' : 'My Appointments'}
          </h1>
          <p className="text-slate-500 text-sm">{appointments.length} total</p>
        </div>
        {user.role !== UserRole.DOCTOR && (
          <button onClick={openBook}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100">
            <Plus className="w-4 h-4" /> Book New
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : appointments.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No appointments yet</p>
          {user.role !== UserRole.DOCTOR && (
            <button onClick={openBook} className="mt-4 text-blue-600 font-semibold text-sm hover:underline">Book your first appointment →</button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4">{user.role === UserRole.DOCTOR ? 'Patient' : 'Doctor'}</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {appointments.map(apt => (
                  <tr key={apt._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 font-semibold text-slate-900">
                      {user.role === UserRole.DOCTOR
                        ? apt.patientName
                        : apt.doctor?.name || 'Doctor'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="text-slate-300">|</span>
                        <Clock className="w-4 h-4 text-slate-400" /> {apt.time}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                        {apt.type === 'Video Call' && <Video className="w-4 h-4 text-blue-500" />}
                        {apt.type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {apt.status === 'Pending' && user.role !== UserRole.DOCTOR && (
                        <button onClick={() => changeStatus(apt._id, 'Cancelled')}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Cancel">
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                      {user.role === UserRole.DOCTOR && apt.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => changeStatus(apt._id, 'Confirmed')}
                            className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition" title="Confirm">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => changeStatus(apt._id, 'Cancelled')}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Cancel">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      {user.role === UserRole.DOCTOR && apt.status === 'Confirmed' && (
                        <button onClick={() => changeStatus(apt._id, 'Completed')}
                          className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition">
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book Modal */}
      {showBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 text-lg">Book Appointment</h3>
              <button onClick={() => setShowBook(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Select Doctor</label>
                <select value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })} required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">Choose a doctor...</option>
                  {doctors.map(d => <option key={d._id} value={d.user?._id || d._id}>{d.name} — {d.specialization} (${d.fees})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Date</label>
                <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm({ ...form, date: e.target.value })} required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Time</label>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option>Consultation</option>
                  <option>Follow-up</option>
                  <option>Video Call</option>
                  <option>Report Review</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  placeholder="Describe your symptoms briefly..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Confirm Booking</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsView;