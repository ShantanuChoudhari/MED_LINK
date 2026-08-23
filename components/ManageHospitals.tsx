
import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Plus, Trash2, RefreshCw, X, CheckCircle } from 'lucide-react';
import { adminApi } from '../services/api';

const ManageHospitals: React.FC = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState({ name: '', address: '', lat: '', lng: '' });
  const [submitting,setSubmitting]= useState(false);
  const [toast,     setToast]     = useState('');

  useEffect(() => { fetchHospitals(); }, []);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getHospitals();
      setHospitals(res.data || []);
    } catch { setHospitals([]); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await adminApi.addHospital({ ...form, lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0 });
      setShowAdd(false); setForm({ name: '', address: '', lat: '', lng: '' });
      showToast('✅ Hospital added!'); fetchHospitals();
    } catch (err: any) { showToast(`❌ ${err.message}`); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}"?`)) return;
    try {
      await adminApi.deleteHospital(id);
      showToast('Hospital removed.'); fetchHospitals();
    } catch (err: any) { showToast(`❌ ${err.message}`); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl text-sm font-medium">{toast}</div>}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Facility Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{hospitals.length} registered facilities</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchHospitals} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700">
            <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 dark:shadow-none">
            <Plus className="w-4 h-4" /> Add Facility
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />)}
        </div>
      ) : hospitals.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hospitals registered yet.</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-blue-600 font-semibold text-sm hover:underline">Add the first facility →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospitals.map((h: any) => (
            <div key={h._id} className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition group relative">
              <button onClick={() => handleDelete(h._id, h.name)}
                className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">{h.name}</h3>
              {h.address && (
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-sm">
                  <MapPin className="w-3.5 h-3.5" /> {h.address}
                </div>
              )}
              <span className="mt-3 inline-block px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase rounded-full">
                Active
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-transparent dark:border-slate-800">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Add Hospital</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X className="w-5 h-5 text-slate-400 dark:text-slate-500" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { label: 'Hospital Name', key: 'name',    placeholder: 'City Central Hospital' },
                { label: 'Address',       key: 'address', placeholder: '123 Broadway, New York' },
                { label: 'Latitude',      key: 'lat',     placeholder: '40.7128' },
                { label: 'Longitude',     key: 'lng',     placeholder: '-74.0060' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">{f.label}</label>
                  <input placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    required={f.key === 'name'}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              ))}
              <button type="submit" disabled={submitting}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Add Facility</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageHospitals;