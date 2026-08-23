
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, RefreshCw, Eye, X, Pill } from 'lucide-react';
import { prescriptionApi, doctorApi } from '../services/api';
import { User, UserRole } from '../types';

interface Props { user: User; }

const CATEGORY_COLORS: Record<string, string> = {
  Cleared: 'bg-green-100 text-green-700',
  Pending: 'bg-orange-100 text-orange-700',
};

const PrescriptionsView: React.FC<Props> = ({ user }) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showCreate,    setShowCreate]    = useState(false);
  const [viewPrx,       setViewPrx]       = useState<any>(null);
  const [patients,      setPatients]      = useState<any[]>([]);
  const [toast,         setToast]         = useState('');

  // Create form state
  const [form, setForm] = useState({
    patientId: '', patientName: '', diagnosis: '', notes: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
  });
  const [submitting, setSubmitting] = useState(false);

  const isDoctor = user.role === UserRole.DOCTOR;

  useEffect(() => { fetchPrescriptions(); }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await prescriptionApi.getAll();
      setPrescriptions(res.data || []);
    } catch { setPrescriptions([]); }
    finally { setLoading(false); }
  };

  const openCreate = async () => {
    setShowCreate(true);
    try {
      const pRes = await doctorApi.getPatients();
      setPatients(pRes.data || []);
    } catch {}
  };

  const addMedicine = () => setForm(f => ({ ...f, medicines: [...f.medicines, { name: '', dosage: '', frequency: '', duration: '' }] }));
  const removeMedicine = (i: number) => setForm(f => ({ ...f, medicines: f.medicines.filter((_, idx) => idx !== i) }));
  const updateMed = (i: number, field: string, value: string) => {
    setForm(f => {
      const meds = [...f.medicines];
      meds[i] = { ...meds[i], [field]: value };
      return { ...f, medicines: meds };
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || form.medicines.some(m => !m.name)) {
      return showToast('❌ Patient and all medicine names are required.');
    }
    setSubmitting(true);
    try {
      await prescriptionApi.create(form);
      setShowCreate(false);
      setForm({ patientId: '', patientName: '', diagnosis: '', notes: '', medicines: [{ name: '', dosage: '', frequency: '', duration: '' }] });
      showToast('✅ Prescription issued!');
      fetchPrescriptions();
    } catch (err: any) { showToast(`❌ ${err.message}`); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prescription?')) return;
    try {
      await prescriptionApi.delete(id);
      showToast('Prescription deleted.'); fetchPrescriptions();
    } catch (err: any) { showToast(`❌ ${err.message}`); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl text-sm font-medium">{toast}</div>}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Prescriptions</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{isDoctor ? 'Prescriptions you have issued' : 'Your received prescriptions'}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchPrescriptions} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700">
            <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
          {isDoctor && (
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 text-sm">
              <Plus className="w-4 h-4" /> Issue Prescription
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}</div>
      ) : prescriptions.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
          <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No prescriptions yet.</p>
          {isDoctor && <button onClick={openCreate} className="mt-3 text-blue-600 font-semibold text-sm hover:underline">Issue first prescription →</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {prescriptions.map(p => (
            <div key={p._id} className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition group relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {isDoctor ? p.patientName || 'Patient' : `Dr. ${p.doctor?.name || 'Doctor'}`}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{p.diagnosis || 'No diagnosis'}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="space-y-1 mb-4">
                {p.medicines?.slice(0, 3).map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span className="font-semibold">{m.name}</span>
                    {m.dosage && <span className="text-slate-400 dark:text-slate-500">· {m.dosage}</span>}
                    {m.frequency && <span className="text-slate-400 dark:text-slate-500">· {m.frequency}</span>}
                  </div>
                ))}
                {p.medicines?.length > 3 && <p className="text-[10px] text-slate-400 dark:text-slate-500">+{p.medicines.length - 3} more</p>}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setViewPrx(p)}
                  className="flex-1 py-2 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> View Full
                </button>
                {isDoctor && (
                  <button onClick={() => handleDelete(p._id)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Prescription Modal */}
      {viewPrx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-transparent dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Prescription</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Issued {new Date(viewPrx.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setViewPrx(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X className="w-5 h-5 text-slate-400 dark:text-slate-500" /></button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-4 grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">Doctor</p><p className="font-semibold dark:text-slate-200">Dr. {viewPrx.doctor?.name}</p></div>
              <div><p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">Patient</p><p className="font-semibold dark:text-slate-200">{viewPrx.patientName}</p></div>
              <div><p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">Diagnosis</p><p className="font-semibold dark:text-slate-200">{viewPrx.diagnosis || '—'}</p></div>
              {viewPrx.validTill && <div><p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">Valid Till</p><p className="font-semibold dark:text-slate-200">{new Date(viewPrx.validTill).toLocaleDateString()}</p></div>}
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3">Medicines</h4>
            <div className="space-y-2 mb-4">
              {viewPrx.medicines?.map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">{i+1}</div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{m.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{[m.dosage, m.frequency, m.duration].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
              ))}
            </div>
            {viewPrx.notes && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase mb-1">Doctor's Notes</p>
                <p className="text-sm text-amber-900 dark:text-amber-200">{viewPrx.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Prescription Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg p-6 my-4 border border-transparent dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Issue Prescription</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X className="w-5 h-5 text-slate-400 dark:text-slate-500" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Patient</label>
                <select value={form.patientId} onChange={e => {
                    const sel = patients.find(p => p.id === e.target.value);
                    setForm(f => ({ ...f, patientId: e.target.value, patientName: sel?.name || '' }));
                  }} required className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Diagnosis</label>
                <input value={form.diagnosis} onChange={e => setForm(f => ({...f, diagnosis: e.target.value}))}
                  placeholder="e.g. Viral infection, Hypertension"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Medicines</label>
                  <button type="button" onClick={addMedicine} className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">+ Add</button>
                </div>
                <div className="space-y-3">
                  {form.medicines.map((m, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2">
                      <div className="flex gap-2">
                        <input value={m.name} onChange={e => updateMed(i, 'name', e.target.value)} placeholder="Medicine name*" required
                          className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <input value={m.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} placeholder="Dosage" 
                          className="w-24 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        {form.medicines.length > 1 && (
                          <button type="button" onClick={() => removeMedicine(i)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300"><X className="w-4 h-4" /></button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input value={m.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} placeholder="Frequency (e.g. Twice daily)"
                          className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <input value={m.duration} onChange={e => updateMed(i, 'duration', e.target.value)} placeholder="Duration"
                          className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2}
                  placeholder="Additional instructions..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Issue Prescription'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionsView;
