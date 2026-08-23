import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Filter, Stethoscope } from 'lucide-react';

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  location: string;
  rating: number;
  fees: number;
  experience: number;
  isAvailable: boolean;
}

const FindDoctors: React.FC = () => {
  const [query, setQuery] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch doctors (all or filtered)
  const fetchDoctors = async (searchTerm = '') => {
    setLoading(true);
    try {
      // Calls the backend endpoint we will create below
      const res = await fetch(`http://localhost:5000/api/v1/patient/doctors?search=${searchTerm}`);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch doctors", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Handle Search Input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors(query);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by name, specialization..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
        </form>
        
        <div className="flex gap-2 w-full md:w-auto">
           <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors">
             <Filter className="w-4 h-4" /> Filters
           </button>
           <button 
             onClick={() => fetchDoctors(query)}
             className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
           >
             Search
           </button>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
      ) : doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div key={doc._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl group-hover:scale-105 transition-transform">
                      {doc.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-1">{doc.name}</h3>
                      <p className="text-sm text-blue-600 font-medium">{doc.specialization}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-slate-700">{doc.rating}</span>
                        <span className="text-xs text-slate-400">({doc.experience}y exp)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-slate-500 mb-6">
                   <div className="flex items-center gap-2">
                     <MapPin className="w-4 h-4 text-slate-400" />
                     {doc.hospital}, {doc.location}
                   </div>
                   <div className="flex items-center gap-2">
                     <Stethoscope className="w-4 h-4 text-slate-400" />
                     {doc.isAvailable ? <span className="text-green-600 font-medium">Available Today</span> : <span className="text-red-500">Next Available: Mon</span>}
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div>
                    <span className="text-xs text-slate-400 block">Consultation Fee</span>
                    <span className="text-lg font-bold text-slate-900">${doc.fees}</span>
                  </div>
                  <button className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State (Similar to your image) */
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No doctors found</h3>
          <p className="text-slate-500 max-w-sm">Try adjusting your search terms or filters to find what you're looking for.</p>
        </div>
      )}
    </div>
  );
};

export default FindDoctors;