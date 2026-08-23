
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Clock, Brain, AlertCircle, CheckCircle, Calendar, X } from 'lucide-react';
import { aiApi, patientApi, appointmentApi } from '../services/api';
import { User } from '../types';

interface Props { user: User; }

const PatientDashboard: React.FC<Props> = ({ user }) => {
  const [symptoms,      setSymptoms]      = useState('');
  const [analyzing,     setAnalyzing]     = useState(false);
  const [aiResult,      setAiResult]      = useState<{ specialization: string; urgency: number; advice: string } | null>(null);
  const [doctors,       setDoctors]       = useState<any[]>([]);
  const [loadingDocs,   setLoadingDocs]   = useState(true);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [specFilter,    setSpecFilter]    = useState('All');
  const [bookingDoc,    setBookingDoc]    = useState<any | null>(null);
  const [bookDate,      setBookDate]      = useState('');
  const [bookTime,      setBookTime]      = useState('');
  const [bookNotes,     setBookNotes]     = useState('');
  const [booking,       setBooking]       = useState(false);
  const [toast,         setToast]         = useState('');

  const specializations = ['All', 'Cardiologist', 'Dermatologist', 'Neurologist', 'Orthopedist', 'Pediatrician', 'General Physician'];

  // Load doctors
  useEffect(() => {
    fetchDoctors();
  }, [specFilter, searchQuery]);

  const fetchDoctors = async () => {
    setLoadingDocs(true);
    try {
      const params: any = {};
      if (specFilter !== 'All') params.specialization = specFilter;
      if (searchQuery)          params.search         = searchQuery;
      const res = await patientApi.searchDoctors(params);
      setDoctors(res.data || []);
    } catch {
      setDoctors([]);
    } finally { setLoadingDocs(false); }
  };

  // AI analysis
  const handleAiAnalyze = async () => {
    if (!symptoms.trim()) return;
    setAnalyzing(true); setAiResult(null);
    try {
      const res = await aiApi.analyze(symptoms);
      setAiResult(res.data);
      // Auto-filter doctors by suggested specialization
      if (res.data?.specialization) {
        setSpecFilter(res.data.specialization);
      }
    } catch {
      setAiResult({ specialization: 'General Physician', urgency: 2, advice: 'Consult a doctor for assessment.' });
    } finally { setAnalyzing(false); }
  };

  // Derive slotType from selected time
  const deriveSlotType = (time: string): string => {
    const hour = parseInt(time.split(':')[0], 10);
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  // Book appointment
  const handleBook = async () => {
    if (!bookDate || !bookTime) return alert('Please select a date and time.');
    setBooking(true);
    try {
      // ✅ Critical fix: use the doctor's User _id (not Doctor profile _id)
      // The Appointment model's 'doctor' field references User, not Doctor profile
      const doctorUserId = bookingDoc.user?._id || bookingDoc.user || bookingDoc._id;
      await appointmentApi.book({
        doctorId:    doctorUserId,
        patientName: user.name,
        date:        bookDate,
        time:        bookTime,
        type:        'Consultation',
        slotType:    deriveSlotType(bookTime),
        notes:       bookNotes,
      });
      setBookingDoc(null);
      setBookDate(''); setBookTime(''); setBookNotes('');
      showToast('✅ Appointment booked successfully!');
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally { setBooking(false); }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const urgencyColor = (u: number) => {
    if (u >= 4) return 'bg-red-500';
    if (u >= 3) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-top-4">
          {toast}
        </div>
      )}

      {/* AI Symptom Analyzer */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Brain className="w-6 h-6" /> AI Symptom Analyzer
          </h2>
          <p className="text-blue-100 text-sm mb-4">Describe your symptoms and our AI will suggest the right specialist.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiAnalyze()}
              placeholder="e.g. sharp chest pain, shortness of breath..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button onClick={handleAiAnalyze} disabled={analyzing || !symptoms}
              className="px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition disabled:opacity-50">
              {analyzing ? 'Analyzing...' : '🔍 Analyze'}
            </button>
          </div>

          {analyzing && (
            <div className="mt-4 flex items-center gap-2 text-blue-200 text-sm">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI is analyzing your symptoms...
            </div>
          )}

          {aiResult && (
            <div className="mt-4 p-4 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm animate-in slide-in-from-bottom-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${urgencyColor(aiResult.urgency)}`}>
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">See a: {aiResult.specialization}</h4>
                  <p className="text-blue-100 text-sm mt-1">{aiResult.advice}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20">
                      Urgency: {aiResult.urgency}/5
                    </span>
                    {aiResult.urgency >= 4 && (
                      <span className="text-xs font-bold text-red-300 bg-red-500/20 px-3 py-1 rounded-full">
                        ⚠️ Seek immediate care
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Specialization Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {specializations.map(s => (
          <button key={s} onClick={() => setSpecFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              specFilter === s ? 'bg-blue-600 text-white shadow' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* Doctor Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text" placeholder="Search doctors by name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Doctor Cards */}
      <section>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
          {specFilter !== 'All' ? `${specFilter}s` : 'All Specialists'}
          <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">({doctors.length} found)</span>
        </h3>
        {loadingDocs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-950 rounded-2xl p-5 animate-pulse h-52 border border-slate-100 dark:border-slate-800" />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No doctors found. Try a different filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map(doc => (
              <div key={doc._id} className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg transition-all group">
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow">
                    {doc.name.split(' ').pop()?.[0] || 'D'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{doc.name}</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{doc.specialization}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{doc.rating}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">• {doc.experience}yrs exp</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {doc.hospital}</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {doc.availability?.slice(0,3).join(', ')} AM</div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">${doc.fees}<span className="text-xs text-slate-400 dark:text-slate-500">/visit</span></span>
                  <button
                    onClick={() => setBookingDoc(doc)}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking Modal */}
      {bookingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 border border-transparent dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Book Appointment</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{bookingDoc.name} · {bookingDoc.specialization}</p>
              </div>
              <button onClick={() => setBookingDoc(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Date</label>
                <input type="date" value={bookDate} min={new Date().toISOString().split('T')[0]}
                  onChange={e => setBookDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Time Slot</label>
                <div className="grid grid-cols-3 gap-2">
                  {(bookingDoc.availability || ['09:00','10:00','14:00','15:00']).map((t: string) => (
                    <button key={t} onClick={() => setBookTime(t)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${bookTime === t ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 dark:bg-slate-900'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Notes (optional)</label>
                <textarea value={bookNotes} onChange={e => setBookNotes(e.target.value)} rows={2}
                  placeholder="Describe your concern briefly..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <span className="text-sm text-slate-600 dark:text-slate-400">Consultation Fee</span>
                <span className="font-black text-slate-900 dark:text-white">${bookingDoc.fees}</span>
              </div>
              <button onClick={handleBook} disabled={booking || !bookDate || !bookTime}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {booking ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Confirm Booking</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
