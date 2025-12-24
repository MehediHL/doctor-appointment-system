import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/db';
import { Doctor, Hospital } from '../types';
import { User, Award, Calendar, ChevronLeft } from 'lucide-react';
import SearchBar from '../components/SearchBar';

export default function Doctors() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [hospital, setHospital] = useState<Hospital | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!hospitalId) return;
      try {
        const [docs, hosp] = await Promise.all([
          db.getDoctorsByHospital(hospitalId),
          db.getHospitalById(hospitalId)
        ]);
        setAllDoctors(docs);
        setHospital(hosp);
      } catch (error) {
        console.error('Failed to load doctors/hospital', error);
    }
    };
    load();
  }, [hospitalId]);

  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) {
      return allDoctors;
    }

    const query = searchQuery.toLowerCase().trim();
    return allDoctors.filter(doctor =>
      doctor.name.toLowerCase().includes(query) ||
      doctor.specialization.toLowerCase().includes(query)
    );
  }, [allDoctors, searchQuery]);

  // Get unique departments (specializations) from filtered doctors
  const departments = useMemo(() => {
    const deptSet = new Set(filteredDoctors.map(d => d.specialization));
    return Array.from(deptSet).sort();
  }, [filteredDoctors]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  if (!hospital) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Hospital not found</h2>
        <Link to="/hospitals" className="text-teal-600 hover:underline mt-4 block">Back to Hospitals</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <Link to="/hospitals" className="inline-flex items-center text-slate-500 hover:text-teal-600 mb-6">
        <ChevronLeft size={20} className="mr-1" /> Back to Hospitals
      </Link>
      
      <div className="bg-white p-6 rounded-xl shadow-sm mb-10 border border-slate-100">
        <h1 className="text-3xl font-bold text-slate-900">{hospital.name}</h1>
        <p className="text-slate-500 mt-2">{hospital.address}</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          placeholder="Search doctors by name or department (specialization)..."
          onSearch={handleSearch}
          className="max-w-2xl"
        />
      </div>

      {/* Departments List */}
      {departments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Available Departments:</h3>
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => (
              <span
                key={dept}
                className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
              >
                {dept}
              </span>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Available Doctors {filteredDoctors.length !== allDoctors.length && `(${filteredDoctors.length} of ${allDoctors.length})`}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <div key={doctor.id} className="bg-white p-6 rounded-xl shadow border border-slate-100 hover:border-teal-200 transition">
            <div className="flex items-start justify-between mb-4">
              {doctor.photo ? (
                <img src={doctor.photo} alt={doctor.name} className="w-16 h-16 rounded-full object-cover border-4 border-teal-50" />
              ) : (
                <div className="bg-teal-100 p-3 rounded-full">
                  <User className="h-8 w-8 text-teal-600" />
                </div>
              )}
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                {doctor.experience} Yrs Exp
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900">{doctor.name}</h3>
            <p className="text-teal-600 font-medium mb-4">{doctor.specialization}</p>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm text-slate-500">
                <Award size={16} className="mr-2" />
                <span>Specialist</span>
              </div>
              <div className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">BM&DC:</span> {doctor.bmdcNumber || 'Not provided'}
              </div>
            </div>

            <div className="mt-6">
              <Link 
                to={`/book/${doctor.id}`} 
                className="w-full block text-center bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition font-medium"
              >
                Book Appointment
              </Link>
            </div>
          </div>
        ))}
        
        {filteredDoctors.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-500 bg-slate-50 rounded-lg">
            {searchQuery ? (
              <>
                <p className="text-lg">No doctors found matching "{searchQuery}"</p>
                <p className="text-sm text-slate-400 mt-2">Try searching with different keywords</p>
              </>
            ) : (
              <p>No doctors currently registered at this hospital.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}