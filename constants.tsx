
import { UserRole, Doctor, Hospital, Appointment } from './types';

export const MOCK_HOSPITALS: Hospital[] = [
  { id: 'h1', name: 'City Central Hospital', location: { lat: 40.7128, lng: -74.0060, address: '123 Broadway, NY' } },
  { id: 'h2', name: 'St. Mary’s Specialty Clinic', location: { lat: 40.7589, lng: -73.9851, address: 'Times Square, NY' } }
];

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'd1',
    hospitalId: 'h1',
    name: 'Dr. Sarah Connor',
    specialization: 'Cardiologist',
    rating: 4.8,
    experience: 12,
    fees: 150,
    availability: ['09:00', '10:00', '14:00', '16:00'],
    bio: 'Expert in non-invasive cardiology and preventative care.',
    reviews: []
  },
  {
    id: 'd2',
    hospitalId: 'h1',
    name: 'Dr. James Smith',
    specialization: 'Dermatologist',
    rating: 4.5,
    experience: 8,
    fees: 100,
    availability: ['11:00', '13:00', '15:00'],
    bio: 'Specializing in pediatric dermatology and laser treatments.',
    reviews: []
  },
  {
    id: 'd3',
    hospitalId: 'h2',
    name: 'Dr. Elena Gilbert',
    specialization: 'Neurologist',
    rating: 4.9,
    experience: 15,
    fees: 200,
    availability: ['10:00', '12:00', '15:00'],
    bio: 'Leading researcher in neuro-regenerative therapy.',
    reviews: []
  },
  {
    id: 'd4',
    hospitalId: 'h2',
    name: 'Dr. Gregory House',
    specialization: 'Diagnostic Medicine',
    rating: 3.2,
    experience: 25,
    fees: 500,
    availability: ['09:00'],
    bio: 'Difficult cases only.',
    reviews: []
  }
];

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', 
  '15:30', '16:00', '16:30', '17:00'
];
