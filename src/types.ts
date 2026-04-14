export type UserRole = 'admin' | 'manager' | 'barber';

export type UserPermission = 
  | 'view_calendar' 
  | 'manage_appointments' 
  | 'view_financials' 
  | 'manage_inventory' 
  | 'manage_expenses' 
  | 'manage_users' 
  | 'manage_services'
  | 'manage_branches';

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  instagram?: string;
  isMain: boolean;
  active: boolean;
  createdAt: string;
}

export interface Barber {
  uid: string;
  name: string;
  bio?: string;
  photoURL?: string;
  role: UserRole;
  permissions?: UserPermission[];
  specialties?: string[];
  paymentType?: 'salary' | 'commission';
  salaryAmount?: number;
  commissionRate?: number; // percentage 0–100
  productCommissionRate?: number; // percentage 0–100 for sales
  isManager?: boolean;
  managerBonus?: number;
  location?: string;
  locationId?: string; // Link to Branch ID
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
  locationId?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  salePrice: number;
  costPrice: number;
  currentStock: number;
  minStock: number;
  sku?: string;
  category?: string;
  imageUrl?: string;
  locationId?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  description: string;
  paymentMethod: string;
  type: 'expense' | 'income';
  isRecurring?: boolean;
  locationId?: string;
  createdAt: string;
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
  locationId?: string;
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

export interface SaleProduct {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Transaction {
  id: string;
  appointmentId?: string;
  customerName: string;
  serviceId?: string;
  serviceName?: string;
  serviceAmount: number;
  products: SaleProduct[];
  productAmount: number;
  barberId: string;
  barberName: string;
  amount: number; // total without tips
  tipAmount: number;
  totalAmount: number; // with tips
  paymentMethod: 'cash' | 'card' | 'interac' | 'local';
  locationId?: string;
  date: string; // ISO string
  createdAt: string; // ISO string
}
