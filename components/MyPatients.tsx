
import React, { useState, useEffect } from 'react';
import { User, Search, Activity, FileText, ChevronRight, RefreshCw } from 'lucide-react';
import { doctorApi } from '../services/api';

interface Props { setActiveTab: (tab: string) => void; }

const MyPatients: React.FC<Props> = ({ setActiveTab }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getPatients();
      setPatients(res.data || []);
    } catch { setPatients([]); }
    finally { setLoading(false); }
  };

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Patient Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{patients.length} unique patients</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Search patients..." />
          </div>
          <button onClick={fetchPatients} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700">
            <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{search ? 'No patients match your search.' : 'No patients yet.'}</p>
          <p className="text-xs mt-1">Patients will appear here after their appointments are booked.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p, i) => (
            <div key={i} className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:shadow-lg transition group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition">
                  {p.name?.[0] || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{p.name || 'Unknown Patient'}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {p.email || 'No email'} · Last visit: {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : 'N/A'}
                  </p>
                  {p.appointmentType && (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{p.appointmentType}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('schedule')}
                  title="View Schedule"
                  className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <Activity className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('prescriptions')}
                  title="Issue Prescription"
                  className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('prescriptions')}
                  title="View Details"
                  className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPatients;