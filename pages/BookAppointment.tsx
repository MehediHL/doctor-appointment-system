import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Doctor, Hospital, Appointment } from '../types';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function BookAppointment() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState<Doctor | undefined>();
  const [hospital, setHospital] = useState<Hospital | undefined>();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [upcomingAvailableDates, setUpcomingAvailableDates] = useState<string[]>([]);

  // Load doctor details and availability
  useEffect(() => {
    if (!doctorId) {
      setError('Doctor ID is missing');
      setLoading(false);
      return;
    }
    const loadDoctor = async () => {
      setLoading(true);
      setError('');
      try {
        const doc = await db.getDoctorById(doctorId);
        if (doc) {
          setDoctor(doc);
          const hosp = await db.getHospitalById(doc.hospitalId);
          if (hosp) {
            setHospital(hosp);
          } else {
            setError('Hospital not found for this doctor');
          }
          
          // Load day-of-week availability
          const dayAvailability: number[] = [];
          for (let day = 0; day < 7; day++) {
            const slots = await db.getDayAvailability(doc.id, day);
            if (slots.length > 0) {
              dayAvailability.push(day);
            }
          }
          setAvailableDays(dayAvailability);
          
          // Calculate upcoming available dates (next 30 days)
          const today = new Date();
          const upcomingDates: string[] = [];
          for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayOfWeek = date.getDay();
            if (dayAvailability.includes(dayOfWeek)) {
              upcomingDates.push(date.toISOString().split('T')[0]);
            }
          }
          setUpcomingAvailableDates(upcomingDates.slice(0, 7)); // Show next 7 available dates
        } else {
          setError('Doctor not found');
        }
      } catch (error) {
        console.error('Failed to load doctor details', error);
        setError('Failed to load doctor details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadDoctor();
  }, [doctorId]);

  // Calculate slots when date changes
  useEffect(() => {
    if (!selectedDate || !doctor) return;
    const loadSlots = async () => {
      try {
        const definedSlots = await db.getAvailability(doctor.id, selectedDate);
        const appointments = (await db.getAppointments()).filter(
      a => a.doctorId === doctor.id && a.date === selectedDate && a.status !== 'cancelled'
    );
    const takenSlots = appointments.map(a => a.timeSlot);
        const freeSlots = definedSlots.filter(slot => !takenSlots.includes(slot)).sort();
    setAvailableSlots(freeSlots);
    setSelectedSlot(null);
      } catch (error) {
        console.error('Failed to load availability', error);
        setAvailableSlots([]);
      }
    };
    loadSlots();
  }, [selectedDate, doctor]);

  const handleBook = async () => {
    if (!user) {
      navigate('/login?redirect=book');
      return;
    }
    if (user.role !== 'patient') {
      setError('Only patients can book appointments.');
      return;
    }
    if (!selectedDate || !selectedSlot || !doctor || !hospital) {
      setError('Please select date and time.');
      return;
    }

    setError('');
    try {
      // Don't include id field - MongoDB will auto-generate _id
      // The id will be added by normalizeId when fetching
      const newAppointment = {
        patientId: user.id,
        doctorId: doctor.id,
        hospitalId: hospital.id,
        date: selectedDate,
        timeSlot: selectedSlot,
        status: 'pending' as const
      };

      await db.addAppointment(newAppointment);
      setSuccess(true);
    } catch (error) {
      console.error('Failed to book appointment', error);
      setError('Failed to book appointment. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Booking Confirmed!</h2>
          <p className="text-slate-600 mb-6">Your appointment with {doctor?.name} on {selectedDate} at {selectedSlot} has been scheduled.</p>
          <button 
            onClick={() => navigate('/patient-dashboard')}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <p className="mt-4 text-slate-600">Loading doctor details...</p>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!doctor || !hospital) {
    return (
      <div className="p-10 text-center">
        <p className="text-slate-600">Doctor or hospital information not available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Book Appointment</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Doctor Info Card */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
            {doctor.photo && (
              <img src={doctor.photo} alt={doctor.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-teal-50" />
            )}
            <h2 className="text-xl font-bold text-slate-800 mb-1">{doctor.name}</h2>
            <p className="text-teal-600 font-medium mb-4">{doctor.specialization}</p>
            <hr className="my-4 border-slate-100" />
            <p className="text-sm text-slate-500 mb-1">Hospital</p>
            <p className="font-medium text-slate-700 mb-4">{hospital.name}</p>
            <p className="text-sm text-slate-500 mb-1">Experience</p>
            <p className="font-medium text-slate-700">{doctor.experience} Years</p>
            <p className="text-sm text-slate-500 mt-4 mb-1">BM&DC Number</p>
            <p className="font-medium text-slate-700">{doctor.bmdcNumber || 'Not provided'}</p>
          </div>
        </div>

        {/* Booking Form */}
        <div className="md:col-span-2">
          <div className="bg-white p-8 rounded-xl shadow-md">
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center">
                <AlertCircle size={20} className="mr-2" />
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                    selectedDate && availableDays.includes(new Date(selectedDate).getDay())
                      ? 'border-teal-500 font-bold'
                      : 'border-slate-300'
                  }`}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              {availableDays.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Available on:</span>{' '}
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                      .filter((_, i) => availableDays.includes(i))
                      .join(', ')}
                  </p>
                  {upcomingAvailableDates.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs text-slate-600 font-semibold">Quick select:</span>
                      {upcomingAvailableDates.map(date => {
                        const dateObj = new Date(date);
                        const isToday = date === new Date().toISOString().split('T')[0];
                        const isSelected = date === selectedDate;
                        return (
                          <button
                            key={date}
                            type="button"
                            onClick={() => setSelectedDate(date)}
                            className={`text-xs px-2 py-1 rounded transition ${
                              isSelected
                                ? 'bg-teal-600 text-white font-bold'
                                : 'bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold'
                            }`}
                          >
                            {isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedDate && (
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center">
                  <Clock size={16} className="mr-1" /> Available Time Slots
                </label>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-2 rounded-lg text-sm font-semibold transition border ${
                          selectedSlot === slot 
                            ? 'bg-teal-600 text-white border-teal-600' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-600'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg">
                    <p className="text-orange-600 font-medium mb-1">No slots available</p>
                    <p className="text-orange-500 text-sm">The doctor has not set availability for this date or all slots are booked.</p>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={handleBook}
              disabled={!selectedSlot}
              className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg transition ${
                selectedSlot 
                  ? 'bg-slate-900 text-white hover:bg-slate-800 transform hover:-translate-y-1' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}