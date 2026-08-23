
import React, { useState, useEffect } from 'react';
import { Search, Star, Clock, Filter } from 'lucide-react';
import { patientApi, appointmentApi } from '../services/api';

const DoctorSearch: React.FC = () => {
  const [doctors,  setDoctors]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState('');
  const [spec,     setSpec]     = useState('All');
  const [booking,  setBooking]  = useState<string | null>(null);
  const [toast,    setToast]    = useState('');

  const specs = ['All','Cardiologist','Dermatologist','Neurologist','Orthopedist','Pediatrician'];

  useEffect(() => { fetchDoctors(); }, [spec, query]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (spec !== 'All') params.specialization = spec;
      if (query)          params.search = query;
      const res = await patientApi.searchDoctors(params);
      setDoctors(res.data || []);
    } catch { setDoctors([]); }
    finally { setLoading(false); }
  };

  const quickBook = async (doc: any) => {
    const date = new Date(); date.setDate(date.getDate() + 1);
    setBooking(doc._id);
    try {
      await appointmentApi.book({
        doctorId: doc.user?._id || doc._id,
        date:     date.toISOString().split('T')[0],
        time:     doc.availability?.[0] || '10:00',
        type:     'Consultation',
      });
      showToast(`✅ Booked with ${doc.name}!`);
    } catch (e: any) { showToast(`❌ ${e.message}`); }
    finally { setBooking(null); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-top-4">{toast}</div>}

      <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Find a Specialist</h1>
          <p className="text-slate-500 text-sm">Book with top-rated professionals instantly.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input type="text" placeholder="Search by name or specialty..."
            value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {specs.map(s => (
          <button key={s} onClick={() => setSpec(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition ${spec === s ? 'bg-blue-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-400'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : doctors.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No doctors found. Try a different specialty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doc => (
            <div key={doc._id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                  {doc.name?.split(' ').pop()?.[0] || 'D'}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{doc.specialization}</span>
                  <h3 className="font-bold text-slate-900">{doc.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-slate-700">{doc.rating}</span>
                    <span className="text-xs text-slate-400">· {doc.experience}yr exp</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{doc.bio || 'Specialist providing comprehensive care.'}</p>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl mb-4">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 font-medium">
                  {doc.availability?.slice(0,3).join(' · ') || '09:00 · 11:00 · 14:00'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-lg">${doc.fees}<span className="text-xs text-slate-400 font-medium">/visit</span></span>
                <button onClick={() => quickBook(doc)} disabled={booking === doc._id}
                  className="px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50">
                  {booking === doc._id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '+ Book'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorSearch;