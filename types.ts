// Data Models matching the Database Schema requirements

export enum Role {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional for frontend state security
  phone?: string;
  photo?: string;
  role: Role;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  contact: string;
  image: string;
}

export type DoctorStatus = 'pending' | 'approved';

export interface Doctor extends User {
  hospitalId: string;
  specialization: string;
  experience: number;
  photo?: string;
  bmdcNumber: string;
  status: DoctorStatus;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
}

export type AvailabilityScope = 'date' | 'day';

export interface DoctorAvailability {
  doctorId: string;
  date?: string; // YYYY-MM-DD when scope === 'date'
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) when scope === 'day'
  slots: string[]; // Array of time strings "09:00", "10:00"
  scope?: AvailabilityScope; // Defaults to 'date' for backward compatibility
}

// Helper types for UI
export interface TimeSlot {
  time: string;
  available: boolean;
}