export interface Barber {
  uid: string;
  name: string;
  bio?: string;
  photoURL?: string;
  role: 'admin' | 'barber';
  specialties?: string[];
  paymentType?: 'salary' | 'commission';
  salaryAmount?: number;
  commissionRate?: number; // percentage 0–100
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
}

export interface Appointment {
  id: string;
  barberId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  date: string; // ISO string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string; // ISO string
}

export interface Review {
  id: string;
  barberId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Loyalty {
  customerId: string;
  points: number;
  history: {
    date: string;
    points: number;
    reason: string;
  }[];
}

export interface PaymentRecord {
  id: string;
  professionalId: string;
  professionalName: string;
  month: number;
  year: number;
  appointmentsCount: number;
  grossAmount: number;
  commissionRate?: number;
  totalAmount: number;
  status: 'pending' | 'paid';
  paidAt?: string;
  createdAt: string;
}
export interface Transaction {
  id: string;
  appointmentId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  barberId: string;
  barberName: string;
  amount: number;
  tipAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'pix' | 'local';
  date: string; // ISO string
  createdAt: string; // ISO string
}
