// ─── Drivers Feature — Mock Data ─────────────────────────────────────────────
// Edit driver seed/mock data ONLY in this file.
// TODO: Replace with real API calls when backend is ready.

import type { Driver } from './types';

export const initialDrivers: Driver[] = [
  { id: 'D001', name: 'Ahmed Khan', phone: '+91 98765 43210', licenseNo: 'DL-982-XYZ', licenseExpiry: '2028-06-15', vehicleId: 'V001', status: 'Available', trips: 142, rating: 4.8, documentVerified: true },
  { id: 'D002', name: 'Ravi Kumar', phone: '+91 97654 32109', licenseNo: 'DL-834-ABC', licenseExpiry: '2027-03-22', vehicleId: 'V002', status: 'On Trip', trips: 98, rating: 4.6, documentVerified: true },
  { id: 'D003', name: 'Imran Ali', phone: '+91 96543 21098', licenseNo: 'DL-441-PQR', licenseExpiry: '2029-01-10', vehicleId: 'V003', status: 'Available', trips: 215, rating: 4.9, documentVerified: true },
  { id: 'D004', name: 'Suresh Yadav', phone: '+91 95432 10987', licenseNo: 'DL-672-LMN', licenseExpiry: '2026-11-30', vehicleId: 'V005', status: 'On Trip', trips: 67, rating: 4.5, documentVerified: true },
  { id: 'D005', name: 'Mohan Singh', phone: '+91 94321 09876', licenseNo: 'DL-319-DEF', licenseExpiry: '2027-08-14', vehicleId: null, status: 'Available', trips: 189, rating: 4.7, documentVerified: true },
  { id: 'D006', name: 'Deepak Verma', phone: '+91 93210 98765', licenseNo: 'DL-155-GHI', licenseExpiry: '2028-04-20', vehicleId: null, status: 'Off Duty', trips: 55, rating: 4.3, documentVerified: false },
];

export const mockDriverMessages: Record<string, { sender: 'driver' | 'dispatcher'; text: string; time: string }[]> = {
  'D001': [
    { sender: 'driver', text: 'Vehicle UP32 AB 1234 is fueled up and ready at Bay 4.', time: '08:15 AM' },
    { sender: 'dispatcher', text: 'Great Ahmed, we are allocating ORD-1001 for Kanpur delivery today.', time: '08:18 AM' },
    { sender: 'driver', text: 'Understood. Awaiting warehouse loading confirmation.', time: '08:20 AM' }
  ],
  'D002': [
    { sender: 'driver', text: 'Passed Etawah toll. Traffic is smooth, ETA Delhi on schedule.', time: '10:50 AM' },
    { sender: 'dispatcher', text: 'Copy that Ravi, keep speed under 70 km/h due to fog advisory.', time: '10:52 AM' }
  ],
  'D003': [
    { sender: 'driver', text: 'Proof of delivery signed by Mr. Sanjay Patel for ORD-0992.', time: '01:40 PM' },
    { sender: 'dispatcher', text: 'Verified! Returning to Kanpur depot approved.', time: '01:42 PM' }
  ]
};
