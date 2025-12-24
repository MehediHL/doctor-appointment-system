import { User, Doctor, Hospital, Appointment, Role } from '../types';
import * as api from './api';

// This file maintains backward compatibility with existing code
// but now uses MongoDB via API calls instead of localStorage

export const FIFTEEN_MINUTE_SLOTS = api.FIFTEEN_MINUTE_SLOTS;

// Helper to convert MongoDB _id to id and handle populated fields
const normalizeId = (item: any) => {
  if (!item) return item;
  
  if (item._id) {
    const { _id, ...rest } = item;
    const normalized = { ...rest, id: _id.toString() };
    
    // Handle populated fields (patientId, doctorId, hospitalId) - extract ID if it's an object
    if (normalized.patientId && typeof normalized.patientId === 'object') {
      normalized.patientId = normalized.patientId._id?.toString() || normalized.patientId.id || normalized.patientId;
    }
    if (normalized.doctorId && typeof normalized.doctorId === 'object') {
      normalized.doctorId = normalized.doctorId._id?.toString() || normalized.doctorId.id || normalized.doctorId;
    }
    if (normalized.hospitalId && typeof normalized.hospitalId === 'object') {
      normalized.hospitalId = normalized.hospitalId._id?.toString() || normalized.hospitalId.id || normalized.hospitalId;
    }
    
    return normalized;
  }
  return item;
};

const normalizeArray = (items: any[]) => items.map(normalizeId);

export const db = {
  // Hospitals
  getHospitals: async (): Promise<Hospital[]> => {
    try {
      const hospitals = await api.hospitalAPI.getAll();
      return normalizeArray(hospitals);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      return [];
    }
  },

  getHospitalById: async (id: string): Promise<Hospital | undefined> => {
    try {
      const hospital = await api.hospitalAPI.getById(id);
      return normalizeId(hospital);
    } catch (error) {
      console.error('Error fetching hospital:', error);
      return undefined;
    }
  },

  addHospital: async (hospital: Hospital) => {
    try {
      await api.hospitalAPI.create(hospital);
    } catch (error) {
      console.error('Error adding hospital:', error);
      throw error;
    }
  },

  deleteHospital: async (id: string) => {
    try {
      await api.hospitalAPI.delete(id);
    } catch (error) {
      console.error('Error deleting hospital:', error);
      throw error;
    }
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    try {
      const users = await api.userAPI.getAll();
      return normalizeArray(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  addUser: async (user: User) => {
    try {
      await api.authAPI.register(user);
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  },

  findUserByEmail: async (email: string): Promise<User | undefined> => {
    try {
      const users = await api.userAPI.getAll();
      const user = users.find((u: any) => u.email === email);
      return user ? normalizeId(user) : undefined;
    } catch (error) {
      console.error('Error finding user:', error);
      return undefined;
    }
  },

  deleteUser: async (id: string) => {
    try {
      await api.userAPI.delete(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Doctors
  getDoctors: async (): Promise<Doctor[]> => {
    try {
      const doctors = await api.doctorAPI.getApproved();
      return normalizeArray(doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
  },

  getDoctorById: async (id: string): Promise<Doctor | undefined> => {
    try {
      const doctor = await api.doctorAPI.getById(id);
      const normalized = normalizeId(doctor);
      // Handle populated hospitalId - if it's an object, extract the id
      if (normalized && normalized.hospitalId && typeof normalized.hospitalId === 'object') {
        normalized.hospitalId = normalized.hospitalId._id?.toString() || normalized.hospitalId.id || normalized.hospitalId;
      }
      return normalized;
    } catch (error) {
      console.error('Error fetching doctor by id:', error);
      return undefined;
    }
  },

  addDoctor: async (doctor: Doctor) => {
    try {
      await api.doctorAPI.update(doctor.id, doctor);
    } catch (error) {
      console.error('Error adding doctor:', error);
      throw error;
    }
  },

  updateDoctor: async (doctorId: string, updates: Partial<Doctor>): Promise<Doctor | null> => {
    try {
      const doctor = await api.doctorAPI.update(doctorId, updates);
      return normalizeId(doctor);
    } catch (error) {
      console.error('Error updating doctor:', error);
      return null;
    }
  },

  getDoctorsByHospital: async (hospitalId: string): Promise<Doctor[]> => {
    try {
      const doctors = await api.doctorAPI.getByHospital(hospitalId);
      return normalizeArray(doctors);
    } catch (error) {
      console.error('Error fetching doctors by hospital:', error);
      return [];
    }
  },

  // Pending Doctors
  getPendingDoctors: async (): Promise<Doctor[]> => {
    try {
      const doctors = await api.doctorAPI.getPending();
      return normalizeArray(doctors);
    } catch (error) {
      console.error('Error fetching pending doctors:', error);
      return [];
    }
  },

  addPendingDoctor: async (doctor: Doctor) => {
    try {
      await api.authAPI.register(doctor);
    } catch (error) {
      console.error('Error adding pending doctor:', error);
      throw error;
    }
  },

  approvePendingDoctor: async (doctorId: string): Promise<Doctor | null> => {
    try {
      const doctor = await api.doctorAPI.approve(doctorId);
      return normalizeId(doctor);
    } catch (error) {
      console.error('Error approving doctor:', error);
      return null;
    }
  },

  deletePendingDoctor: async (doctorId: string) => {
    try {
      await api.doctorAPI.delete(doctorId);
    } catch (error) {
      console.error('Error deleting pending doctor:', error);
      throw error;
    }
  },

  deleteDoctor: async (doctorId: string) => {
    try {
      await api.doctorAPI.delete(doctorId);
    } catch (error) {
      console.error('Error deleting doctor:', error);
      throw error;
    }
  },

  // Availability
  getAvailability: async (doctorId: string, date: string): Promise<string[]> => {
    try {
      return await api.availabilityAPI.get(doctorId, date);
    } catch (error) {
      console.error('Error fetching availability:', error);
      return [];
    }
  },

  setAvailability: async (doctorId: string, date: string, slots: string[]) => {
    try {
      await api.availabilityAPI.set(doctorId, date, slots);
    } catch (error) {
      console.error('Error setting availability:', error);
      throw error;
    }
  },

  getDayAvailability: async (doctorId: string, dayOfWeek: number): Promise<string[]> => {
    try {
      return await api.availabilityAPI.getDay(doctorId, dayOfWeek);
    } catch (error) {
      console.error('Error fetching day availability:', error);
      return [];
    }
  },

  setDayAvailability: async (doctorId: string, dayOfWeek: number, slots: string[]) => {
    try {
      await api.availabilityAPI.setDay(doctorId, dayOfWeek, slots);
    } catch (error) {
      console.error('Error setting day availability:', error);
      throw error;
    }
  },

  // Appointments
  getAppointments: async (): Promise<Appointment[]> => {
    try {
      const appointments = await api.appointmentAPI.getAll();
      return normalizeArray(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  },

  addAppointment: async (apt: Omit<Appointment, 'id'> | Appointment) => {
    try {
      // Remove id if present - MongoDB will auto-generate _id
      const { id, ...appointmentData } = apt as any;
      await api.appointmentAPI.create(appointmentData);
    } catch (error) {
      console.error('Error adding appointment:', error);
      throw error;
    }
  },

  updateAppointmentStatus: async (id: string, status: Appointment['status']) => {
    try {
      await api.appointmentAPI.updateStatus(id, status);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  },

  deleteAppointment: async (id: string) => {
    try {
      await api.appointmentAPI.delete(id);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  },

  // Auth Helpers
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const user = await api.authAPI.login(email, password);
    if (user) {
        const normalized = normalizeId(user);
        localStorage.setItem('mc_current_user', JSON.stringify(normalized));
        return normalized as User;
    }
    return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('mc_current_user');
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('mc_current_user');
    return stored ? JSON.parse(stored) : null;
  }
};
