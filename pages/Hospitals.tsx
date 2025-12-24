import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/db';
import { Hospital } from '../types';
import { MapPin, Phone, ArrowRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';

export default function Hospitals() {
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const data = await db.getHospitals();
        setAllHospitals(data);
      } catch (error) {
        console.error('Failed to load hospitals', error);
      }
    };
    loadHospitals();
  }, []);

  const filteredHospitals = useMemo(() => {
    if (!searchQuery.trim()) {
      return allHospitals;
    }

    const query = searchQuery.toLowerCase().trim();
    return allHospitals.filter(hospital =>
      hospital.name.toLowerCase().includes(query) ||
      hospital.address.toLowerCase().includes(query)
    );
  }, [allHospitals, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Our Partner Hospitals</h1>
      
      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar
          placeholder="Search hospitals by name or address..."
          onSearch={handleSearch}
          className="max-w-2xl"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredHospitals.map((hospital) => (
          <div key={hospital.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 flex flex-col">
            <div className="h-48 overflow-hidden">
              <img 
                src={hospital.image} 
                alt={hospital.name} 
                className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
              />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <h2 className="text-xl font-bold text-slate-900 mb-2">{hospital.name}</h2>
              <div className="flex items-start text-slate-600 mb-2 text-sm">
                <MapPin size={16} className="mr-2 mt-1 flex-shrink-0" />
                <span>{hospital.address}</span>
              </div>
              <div className="flex items-center text-slate-600 mb-6 text-sm">
                <Phone size={16} className="mr-2" />
                <span>{hospital.contact}</span>
              </div>
              <div className="mt-auto">
                <Link 
                  to={`/hospital/${hospital.id}/doctors`} 
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
                >
                  View Doctors <ArrowRight size={16} className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredHospitals.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-100">
          {searchQuery ? (
            <>
              <p className="text-slate-500 text-lg">No hospitals found matching "{searchQuery}"</p>
              <p className="text-slate-400 text-sm mt-2">Try searching with different keywords</p>
            </>
          ) : (
            <p className="text-slate-500">No hospitals found in the directory.</p>
          )}
        </div>
      )}
    </div>
  );
}