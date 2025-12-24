import React from 'react';
import { Link } from 'react-router-dom';
import { Hospital, Doctor } from '../types';
import { Building2, User, MapPin, ArrowRight } from 'lucide-react';
import { db } from '../services/db';

interface SearchResultsProps {
  hospitals: Hospital[];
  doctors: Doctor[];
  query: string;
}

export default function SearchResults({ hospitals, doctors, query }: SearchResultsProps) {
  if (!query.trim()) {
    return null;
  }

  const hasResults = hospitals.length > 0 || doctors.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Search Results for "{query}"
      </h2>

      {!hasResults ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-lg">No results found for "{query}"</p>
          <p className="text-slate-400 text-sm mt-2">Try searching with different keywords</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Hospitals Section */}
          {hospitals.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                <Building2 size={20} className="mr-2 text-teal-600" />
                Hospitals ({hospitals.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hospitals.map((hospital) => (
                  <div key={hospital.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300">
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={hospital.image} 
                        alt={hospital.name} 
                        className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <h4 className="text-lg font-bold text-slate-900 mb-2">{hospital.name}</h4>
                      <div className="flex items-start text-slate-600 mb-3 text-sm">
                        <MapPin size={16} className="mr-2 mt-1 flex-shrink-0" />
                        <span>{hospital.address}</span>
                      </div>
                      <Link 
                        to={`/hospital/${hospital.id}/doctors`} 
                        className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium text-sm"
                      >
                        View Doctors <ArrowRight size={16} className="ml-1" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctors Section */}
          {doctors.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                <User size={20} className="mr-2 text-teal-600" />
                Doctors ({doctors.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => {
                  const hospital = db.getHospitalById(doctor.hospitalId);
                  return (
                    <div key={doctor.id} className="bg-white p-6 rounded-xl shadow border border-slate-100 hover:border-teal-200 transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-teal-100 p-3 rounded-full">
                          <User className="h-8 w-8 text-teal-600" />
                        </div>
                        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                          {doctor.experience} Yrs Exp
                        </span>
                      </div>
                      
                      <h4 className="text-xl font-bold text-slate-900">{doctor.name}</h4>
                      <p className="text-teal-600 font-medium mb-2">{doctor.specialization}</p>
                      {hospital && (
                        <p className="text-slate-500 text-sm mb-4">{hospital.name}</p>
                      )}
                      
                      <Link 
                        to={`/book/${doctor.id}`} 
                        className="w-full block text-center bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition font-medium"
                      >
                        Book Appointment
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

