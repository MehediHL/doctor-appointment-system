import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, UserPlus, Building2, Search } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import SearchResults from '../components/SearchResults';
import { db } from '../services/db';
import { Hospital, Doctor } from '../types';

export default function Home() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [hospData, docData] = await Promise.all([
          db.getHospitals(),
          db.getDoctors()
        ]);
        setHospitals(hospData);
        setDoctors(docData);
      } catch (error) {
        console.error('Failed to load search data', error);
      }
    };
    loadData();
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return { hospitals: [], doctors: [] };
    }

    const query = searchQuery.toLowerCase().trim();
    const filteredHospitals = hospitals.filter(hospital =>
      hospital.name.toLowerCase().includes(query)
    );

    const filteredDoctors = doctors.filter(doctor =>
      doctor.name.toLowerCase().includes(query)
    );

    return {
      hospitals: filteredHospitals,
      doctors: filteredDoctors
    };
  }, [searchQuery, hospitals, doctors]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-teal-600 to-cyan-700 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Book Doctor Appointments <br className="hidden md:block" /> with Ease & Confidence
          </h1>
          <p className="text-lg md:text-xl text-teal-100 mb-10 max-w-2xl mx-auto">
            Find the best doctors, check real-time availability, and secure your slot in seconds. 
            Manage your health journey seamlessly.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar
              placeholder="Search hospitals or doctors..."
              onSearch={handleSearch}
              className="w-full"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/hospitals" 
              className="px-8 py-4 bg-white text-teal-700 rounded-lg font-bold text-lg shadow-lg hover:bg-gray-100 transition transform hover:-translate-y-1"
            >
              Find a Doctor
            </Link>
            <Link 
              to="/register" 
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white/10 transition"
            >
              Join as Patient
            </Link>
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      {searchQuery && (
        <section className="py-10 bg-slate-50">
          <SearchResults
            hospitals={searchResults.hospitals}
            doctors={searchResults.doctors}
            query={searchQuery}
          />
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">How It Works</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Simple steps to get the care you need.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard 
              icon={<Search className="w-10 h-10 text-teal-600" />}
              title="1. Find a Hospital"
              description="Browse top-rated hospitals and clinics in your area."
            />
             <FeatureCard 
              icon={<UserPlus className="w-10 h-10 text-teal-600" />}
              title="2. Choose a Doctor"
              description="View profiles, specializations, and experience to find the right match."
            />
             <FeatureCard 
              icon={<CalendarCheck className="w-10 h-10 text-teal-600" />}
              title="3. Book Appointment"
              description="Select a convenient time slot and get instant confirmation."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-100 py-20">
        <div className="max-w-5xl mx-auto px-4 bg-teal-800 rounded-3xl p-10 md:p-16 text-center text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Are you a qualified Doctor?</h2>
            <p className="text-teal-100 mb-8 text-lg">Join our network to manage your appointments efficiently and reach more patients.</p>
            <Link to="/register" className="inline-block px-8 py-3 bg-white text-teal-900 font-bold rounded-lg shadow hover:bg-gray-50 transition">
              Register as Doctor
            </Link>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 translate-y-1/2"></div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="text-center p-8 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition bg-white">
      <div className="bg-teal-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}