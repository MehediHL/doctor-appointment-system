import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, FIFTEEN_MINUTE_SLOTS } from '../../services/db';
import { Appointment, Doctor } from '../../types';
import { Calendar, User, Check, X, Clock, Save, ImagePlus } from 'lucide-react';

interface DoctorAppointment extends Appointment {
  patientName: string;
}

export default function DoctorDashboard() {
  const { user, login } = useAuth();
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'availability' | 'profile'>('appointments');
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Availability State
  const [draftAvailability, setDraftAvailability] = useState<Record<string, string[]>>({});
  const [activeDate, setActiveDate] = useState<string>(today);
  const [dateInput, setDateInput] = useState<string>(today);
  const [saveStatus, setSaveStatus] = useState('');
  const [availabilityMode, setAvailabilityMode] = useState<'date' | 'day'>('date');
  const [activeDay, setActiveDay] = useState<number>(0);
  const [dayAvailability, setDayAvailability] = useState<Record<number, string[]>>({});

  // Profile state
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState('');

  const managedDates = useMemo(() => Object.keys(draftAvailability).sort(), [draftAvailability]);

  const ensureDraftForDate = useCallback(async (date: string, { activate = true } = {}) => {
    if (!user || !date) return;
    const slots = await db.getAvailability(user.id, date);
    setDraftAvailability(prev => {
      if (prev[date]) {
        return prev;
      }
      return { ...prev, [date]: slots };
    });
    if (activate) {
      setActiveDate(date);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user]);

  useEffect(() => {
    setProfilePreview(user?.photo || null);
  }, [user]);

  useEffect(() => {
    if (activeTab === 'availability' && user) {
      if (managedDates.length === 0) {
        ensureDraftForDate(today);
      }
      const loadDayAvail = async () => {
        try {
          const entries = await Promise.all([
            db.getDayAvailability(user.id, 0),
            db.getDayAvailability(user.id, 1),
            db.getDayAvailability(user.id, 2),
            db.getDayAvailability(user.id, 3),
            db.getDayAvailability(user.id, 4),
            db.getDayAvailability(user.id, 5),
            db.getDayAvailability(user.id, 6),
          ]);
          setDayAvailability({
            0: entries[0],
            1: entries[1],
            2: entries[2],
            3: entries[3],
            4: entries[4],
            5: entries[5],
            6: entries[6],
          });
        } catch (error) {
          console.error('Failed to load day availability', error);
        }
      };
      loadDayAvail();
    }
  }, [activeTab, user, managedDates.length, ensureDraftForDate, today]);

  const loadAppointments = async () => {
    try {
      const allAppointments = await db.getAppointments();
      const users = await db.getUsers();
      // Filter by doctorId - handle both string and normalized object cases
      const filtered = allAppointments.filter(a => {
        const doctorId = typeof a.doctorId === 'object' ? a.doctorId._id?.toString() || a.doctorId.id : a.doctorId;
        return doctorId === user?.id;
      });
      const withNames = filtered.map(a => {
        const patientId = typeof a.patientId === 'object' ? a.patientId._id?.toString() || a.patientId.id : a.patientId;
        const p = users.find(u => u.id === patientId);
        return { 
          ...a,
          patientId: patientId,
          doctorId: typeof a.doctorId === 'object' ? a.doctorId._id?.toString() || a.doctorId.id : a.doctorId,
          patientName: p?.name || 'Unknown' 
        };
      });
      withNames.sort((a, b) => new Date(`${a.date} ${a.timeSlot}`).getTime() - new Date(`${b.date} ${b.timeSlot}`).getTime());
      setAppointments(withNames);
    } catch (error) {
      console.error('Failed to load appointments', error);
    }
  };

  const handleAddDate = () => {
    if (!user || !dateInput) return;
    if (new Date(dateInput) < new Date(today)) {
      alert('Please pick today or a future date.');
      return;
    }
    ensureDraftForDate(dateInput);
  };

  const handleRemoveDate = (date: string) => {
    setDraftAvailability(prev => {
      if (Object.keys(prev).length <= 1) return prev;
      const updated = { ...prev };
      delete updated[date];
      const remaining = Object.keys(updated).sort();
      if (date === activeDate && remaining.length) {
        setActiveDate(remaining[0]);
      }
      return updated;
    });
  };

  const toggleSlot = (slot: string) => {
    if (availabilityMode === 'date') {
      if (!activeDate) return;
      setDraftAvailability(prev => {
        const existing = prev[activeDate] || [];
        const next = existing.includes(slot)
          ? existing.filter(s => s !== slot)
          : [...existing, slot];
        return { ...prev, [activeDate]: next.sort() };
      });
    } else {
      setDayAvailability(prev => {
        const existing = prev[activeDay] || [];
        const next = existing.includes(slot)
          ? existing.filter(s => s !== slot)
          : [...existing, slot];
        return { ...prev, [activeDay]: next.sort() };
      });
    }
  };

  const saveAvailability = async () => {
    if (!user) return;

    try {
      if (managedDates.length) {
        await Promise.all(managedDates.map(date => {
          const slots = draftAvailability[date] || [];
          return db.setAvailability(user.id, date, [...slots].sort());
        }));
      }

      await Promise.all(Object.entries(dayAvailability).map(([day, slots]) => 
        db.setDayAvailability(user.id, Number(day), [...slots].sort())
      ));

      setSaveStatus('Availability saved!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to save availability', error);
      setSaveStatus('Failed to save');
    }
  };

  const handleProfilePhotoUpload = (file?: File) => {
    if (!user || !file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result?.toString() || '';
      const updatedDoctor = await db.updateDoctor(user.id, { photo: base64 });
      if (updatedDoctor) {
        const { password: _pw, ...safeDoctor } = updatedDoctor as Doctor;
        login(safeDoctor);
        setProfilePreview(base64);
        setPhotoStatus('Profile picture updated!');
        setTimeout(() => setPhotoStatus(''), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStatusChange = async (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await db.updateAppointmentStatus(id, status);
      await loadAppointments();
    } catch (error) {
      alert('Failed to update appointment status');
    }
  };

  const pending = appointments.filter(a => a.status === 'pending');
  const scheduled = appointments.filter(a => a.status === 'confirmed');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const selectedSlots = availabilityMode === 'date' ? draftAvailability[activeDate] || [] : dayAvailability[activeDay] || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">Doctor Dashboard</h1>
           <p className="text-slate-500 mt-1">Welcome, {user?.name}</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-lg shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center ${
              activeTab === 'appointments' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar size={16} className="mr-2" /> Appointments
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center ${
              activeTab === 'availability' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock size={16} className="mr-2" /> Availability
          </button>
          <button
             onClick={() => setActiveTab('profile')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center ${
               activeTab === 'profile' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
             }`}
           >
             <User size={16} className="mr-2" /> Profile
           </button>
        </div>
      </div>

      {activeTab === 'appointments' && (
        <>
          {pending.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                 <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span> Pending Requests
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pending.map(apt => (
                  <div key={apt.id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500 animate-fade-in">
                    <h3 className="font-bold text-lg text-slate-800">{apt.patientName}</h3>
                    <div className="text-sm text-slate-600 my-2 space-y-1">
                      <div className="flex items-center"><Calendar size={14} className="mr-2"/> {apt.date}</div>
                      <div className="flex items-center"><Clock size={14} className="mr-2"/> {apt.timeSlot}</div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => handleStatusChange(apt.id, 'confirmed')}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 flex justify-center items-center"
                      >
                        <Check size={16} className="mr-1" /> Accept
                      </button>
                      <button 
                        onClick={() => handleStatusChange(apt.id, 'cancelled')}
                        className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 flex justify-center items-center"
                      >
                        <X size={16} className="mr-1" /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Upcoming Schedule</h2>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {scheduled.length > 0 ? (
                    scheduled.map(apt => (
                      <tr key={apt.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {apt.date} <span className="text-slate-400 mx-1">at</span> {apt.timeSlot}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{apt.patientName}</td>
                        <td className="px-6 py-4">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Confirmed</span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleStatusChange(apt.id, 'completed')}
                            className="text-teal-600 hover:underline font-medium"
                          >
                            Mark Completed
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No confirmed appointments scheduled.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'availability' && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-slate-100 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={() => setAvailabilityMode('date')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm border ${
                availabilityMode === 'date' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              By Specific Date
            </button>
            <button
              onClick={() => setAvailabilityMode('day')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm border ${
                availabilityMode === 'day' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              By Day of Week
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Selector Column */}
            <div className="md:w-1/3 space-y-4">
              {availabilityMode === 'date' ? (
                <>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Select Dates</h3>
                    <div className="flex gap-2">
                      <input 
                        type="date" 
                        value={dateInput}
                        min={today}
                        onChange={(e) => setDateInput(e.target.value)}
                        className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddDate}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      Queue up future dates. Switch between them without losing slot selections.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {managedDates.map(date => (
                      <div
                        key={date}
                        className={`flex items-center justify-between p-3 rounded-lg border transition cursor-pointer ${
                          activeDate === date ? 'bg-teal-50 border-teal-500' : 'border-slate-200 hover:border-teal-300'
                        }`}
                        onClick={() => setActiveDate(date)}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{date}</p>
                          <p className="text-xs text-slate-500">{(draftAvailability[date] || []).length} slots selected</p>
                        </div>
                        {managedDates.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveDate(date);
                            }}
                            className="text-xs text-slate-400 hover:text-red-500 font-semibold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {managedDates.length === 0 && (
                      <p className="text-sm text-slate-500">Add a date to begin planning availability.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-slate-800 mb-2">Select Day of Week</h3>
                  {dayNames.map((label, idx) => (
                    <div
                      key={label}
                      className={`flex items-center justify-between p-3 rounded-lg border transition cursor-pointer ${
                        activeDay === idx ? 'bg-teal-50 border-teal-500' : 'border-slate-200 hover:border-teal-300'
                      }`}
                      onClick={() => setActiveDay(idx)}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{label}</p>
                        <p className="text-xs text-slate-500">{(dayAvailability[idx] || []).length} slots selected</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slot Selection */}
            <div className="md:w-2/3">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                 <div>
                   <h3 className="font-bold text-lg text-slate-800">Available Time Slots</h3>
                   <p className="text-sm text-slate-500">
                     Editing schedule for <span className="font-semibold text-slate-700">
                       {availabilityMode === 'date' ? activeDate : dayNames[activeDay]}
                     </span>
                   </p>
                 </div>
                 <span className="text-sm text-teal-600 font-medium">{selectedSlots.length} slots selected</span>
               </div>
               
               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
                 {FIFTEEN_MINUTE_SLOTS.map(slot => (
                   <button
                     key={slot}
                     onClick={() => toggleSlot(slot)}
                     className={`py-2 px-1 rounded-lg text-sm font-semibold transition border ${
                       selectedSlots.includes(slot)
                         ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-105' 
                         : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600'
                     }`}
                   >
                     {slot}
                   </button>
                 ))}
               </div>

               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t pt-6 border-slate-100 gap-3">
                  <div className="text-green-600 font-medium text-sm min-h-[1.5rem]">
                    {saveStatus}
                  </div>
                  <button 
                    onClick={saveAvailability}
                    className="flex items-center justify-center bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition shadow-lg"
                  >
                    <Save size={18} className="mr-2" /> Save Availability
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
         <div className="bg-white p-8 rounded-xl shadow-md border border-slate-100 animate-fade-in">
            <div className="max-w-md mx-auto text-center space-y-4">
              {profilePreview ? (
                <img src={profilePreview} alt={user?.name} className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-teal-50" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                  <User size={48} className="text-slate-400" />
                </div>
              )}
              <h3 className="text-2xl font-bold text-slate-800">{user?.name}</h3>
              <p className="text-slate-500">{user?.email}</p>
              <p className="text-sm text-slate-400">Upload a professional headshot so patients can recognize you easily.</p>
              <label className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-lg font-semibold cursor-pointer hover:bg-slate-800 transition">
                <ImagePlus size={18} />
                Upload Photo
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => handleProfilePhotoUpload(e.target.files?.[0])}
                />
              </label>
              {photoStatus && <p className="text-green-600 text-sm">{photoStatus}</p>}
              <p className="text-xs text-slate-400">PNG or JPG, up to 2MB. Square images look best.</p>
            </div>
         </div>
      )}
    </div>
  );
}