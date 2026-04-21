export interface NetworkConfig {
  id: string;
  name: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  phone: string;
  slogan: string;
  about: string;
  language: string; // 'pt-BR', 'en-US', etc.
  currency: string; // 'BRL', 'USD', 'EUR'
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  isMain: boolean;
  active: boolean;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'barber';
  locationId?: string;
  photoURL?: string;
  status?: 'active' | 'inactive';
}

export interface Barber extends User {
  specialty?: string[];
  bio?: string;
  email: string; // Required for professional login
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category?: string;
  active: boolean;
  locationId?: string;
}

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId: string;
  barberId: string;
  locationId: string;
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  paymentMethod: string;
  customerId?: string;
  barberId?: string;
  locationId: string;
  date: string;
  commissionPaid?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  category: string;
  locationId: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  lastVisit?: string;
  totalSpent?: number;
}

export interface CashFlow {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  locationId: string;
  barberId?: string; // If commission-related
}
