
import React, { useState, useEffect } from 'react';
import { User as UserIcon, Save, Stethoscope, DollarSign, Clock, MapPin, Edit2, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { doctorApi } from '../services/api';

const SPECIALIZATIONS = [
  'Cardiologist','Dermatologist','Neurologist','Orthopedist','Pediatrician',
  'General Physician','ENT Specialist','Ophthalmologist','Psychiatrist',
  'Gastroenterologist','Endocrinologist','Urologist','Oncologist',
];

const DoctorProfileEdit: React.FC = () => {
  const [profile,   setProfile]   = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState('');
  const [form,      setForm]      = useState<any>({});
  const [newSlot,   setNewSlot]   = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getProfile();
      setProfile(res.data);
      setForm({
        name:           res.data.name           || '',
        specialization: res.data.specialization || 'General Physician',
        fees:           res.data.fees           || 100,
        experience:     res.data.experience     || 1,
        hospital:       res.data.hospital       || '',
        location:       res.data.location       || '',
        bio:            res.data.bio            || '',
        availability:   res.data.availability   || [],
        isAvailable:    res.data.isAvailable    ?? true,
      });
    } catch {
      showToast('❌ Could not load profile. Make sure you are logged in as a doctor.');
    } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await doctorApi.updateProfile(form);
      setProfile(res.data);
      showToast('✅ Profile updated successfully!');
    } catch (err: any) {
      showToast(`❌ ${err.message}`);
    } finally { setSaving(false); }
  };

  const addSlot = () => {
    if (!newSlot || form.availability?.includes(newSlot)) return;
    setForm((f: any) => ({ ...f, availability: [...(f.availability || []), newSlot].sort() }));
    setNewSlot('');
  };

  const removeSlot = (slot: string) => {
    setForm((f: any) => ({ ...f, availability: f.availability.filter((s: string) => s !== slot) }));
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  if (loading) {
    return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl text-sm font-medium">{toast}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Profile</h1>
          <p className="text-slate-500 text-sm">Update your professional information</p>
        </div>
        <button onClick={fetchProfile} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar / status */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-4xl mb-4 shadow-lg">
              {(form.name || 'D')[0]}
            </div>
            <h3 className="font-bold text-slate-900">{form.name || 'Your Name'}</h3>
            <p className="text-blue-600 text-sm font-medium">{form.specialization}</p>
            <p className="text-slate-400 text-xs mt-1">{form.hospital}</p>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Available for booking</span>
                <button type="button" onClick={() => setForm((f: any) => ({ ...f, isAvailable: !f.isAvailable }))}>
                  {form.isAvailable
                    ? <ToggleRight className="w-8 h-8 text-blue-600" />
                    : <ToggleLeft  className="w-8 h-8 text-slate-300" />
                  }
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">{form.isAvailable ? 'Patients can book you' : 'Hidden from search'}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            {[
              { label: 'Consultation Fee',  icon: DollarSign, value: `$${profile?.fees || 0}` },
              { label: 'Experience',        icon: Stethoscope, value: `${profile?.experience || 0} years` },
              { label: 'Rating',            icon: Edit2,       value: `${profile?.rating || '—'} / 5` },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{s.label}</p>
                  <p className="font-bold text-slate-900 text-sm">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Edit form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><UserIcon className="w-5 h-5 text-blue-600" />Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Full Name</label>
                <input value={form.name} onChange={e => setForm((f: any) => ({...f, name: e.target.value}))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Specialization</label>
                <select value={form.specialization} onChange={e => setForm((f: any) => ({...f, specialization: e.target.value}))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Consultation Fee ($)</label>
                <input type="number" min={0} value={form.fees} onChange={e => setForm((f: any) => ({...f, fees: Number(e.target.value)}))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Years of Experience</label>
                <input type="number" min={0} value={form.experience} onChange={e => setForm((f: any) => ({...f, experience: Number(e.target.value)}))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Hospital / Clinic</label>
                <input value={form.hospital} onChange={e => setForm((f: any) => ({...f, hospital: e.target.value}))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Location / City</label>
                <input value={form.location} onChange={e => setForm((f: any) => ({...f, location: e.target.value}))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Professional Bio</label>
                <textarea rows={3} value={form.bio} onChange={e => setForm((f: any) => ({...f, bio: e.target.value}))}
                  placeholder="Describe your experience and specialties..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
              </div>
            </div>
          </div>

          {/* Availability Slots */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-600" />Time Slots</h3>
            <div className="flex gap-2 mb-3">
              <input type="time" value={newSlot} onChange={e => setNewSlot(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <button type="button" onClick={addSlot}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.availability || []).map((slot: string) => (
                <button type="button" key={slot} onClick={() => removeSlot(slot)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">
                  {slot} ×
                </button>
              ))}
              {(form.availability || []).length === 0 && (
                <p className="text-slate-400 text-xs">No time slots added yet</p>
              )}
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> Save Profile</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorProfileEdit;
