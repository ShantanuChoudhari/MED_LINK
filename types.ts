
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Hospital {
  id: string;
  name: string;
  location: { lat: number; lng: number; address: string };
}

export interface Doctor {
  id: string;
  hospitalId: string;
  name: string;
  specialization: string;
  rating: number;
  experience: number;
  fees: number;
  availability: string[]; // e.g., ["09:00", "10:00"]
  bio: string;
  reviews: Review[];
}

export interface Review {
  id: string;
  patientId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  type: 'IN_PERSON' | 'VIDEO';
  paymentStatus: 'PAID' | 'UNPAID';
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  symptoms: string[];
  diagnosis: string;
  prescription: string;
  attachments?: string[];
}
