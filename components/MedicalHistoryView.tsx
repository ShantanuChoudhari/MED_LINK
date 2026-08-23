
import React, { useState, useEffect } from 'react';
import { recordsApi } from '../services/api';
import { FileText, Plus, Trash2, RefreshCw, X, Search, Upload } from 'lucide-react';

const CATEGORIES = ['All','Lab Results','Consultation','Prescription','Imaging','Surgery','Other'];

const CATEGORY_COLORS: Record<string, string> = {
  'Lab Results':  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Consultation': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Prescription': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Imaging':      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Surgery':      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Other':        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const MedicalHistoryView: React.FC = () => {
  const [records,  setRecords]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('All');
  const [showAdd,  setShowAdd]  = useState(false);
  const [toast,    setToast]    = useState('');
  const [form,     setForm]     = useState({ title: '', category: 'Other', description: '', provider: '', date: '' });
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await recordsApi.getAll();
      setRecords(res.data || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await recordsApi.create({ ...form, date: form.date || new Date().toISOString().split('T')[0] });
      setShowAdd(false);
      setForm({ title: '', category: 'Other', description: '', provider: '', date: '' });
      showToast('✅ Record added!');
      fetchRecords();
    } catch (err: any) { showToast(`❌ ${err.message}`); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    try {
      await recordsApi.delete(id);
      showToast('Record deleted.');
      setRecords(r => r.filter(x => x._id !== id));
    } catch (err: any) { showToast(`❌ ${err.message}`); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const filtered = records.filter(r => {
    const matchSearch = r.title?.toLowerCase().includes(search.toLowerCase()) ||
                        r.provider?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || r.category === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl text-sm font-medium">{toast}</div>}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Medical History</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{records.length} health records secured</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-white"
              placeholder="Search records..." />
          </div>
          <button onClick={fetchRecords} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700">
            <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 dark:shadow-none text-sm">
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition ${filter === c ? 'bg-blue-600 text-white shadow dark:shadow-none' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-36 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{search || filter !== 'All' ? 'No matching records.' : 'No records yet.'}</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-blue-600 font-semibold text-sm hover:underline">+ Add your first record</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(r => (
            <div key={r._id} className="group bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{r.title}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{r.provider || 'Unknown Provider'} · {new Date(r.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(r._id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {r.description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{r.description}</p>}
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${CATEGORY_COLORS[r.category] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                {r.category}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add Record Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-transparent dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Add Medical Record</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X className="w-5 h-5 text-slate-400 dark:text-slate-500" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Record Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required
                  placeholder="e.g. Blood Test Report"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Healthcare Provider</label>
                <input value={form.provider} onChange={e => setForm(f => ({...f, provider: e.target.value}))}
                  placeholder="e.g. City Central Hospital"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2}
                  placeholder="Brief summary of findings..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Upload className="w-4 h-4" /> Save Record</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalHistoryView;