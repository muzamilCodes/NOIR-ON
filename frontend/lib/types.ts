export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Specs {
  movement?: string;
  case?: string;
  water?: string;
  power?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  tagline: string;
  description: string;
  caseColor: number;
  strapColor: number;
  image: string;
  specs: Specs;
}

export interface CartItem extends Product {
  qty: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  userId: string;
  email: string;
  items: OrderItem[];
  total: number;
  address?: Address;
  paymentMethod?: string;
  status: string;
  date: string;
}

export interface AdminStats {
  products: number;
  orders: number;
  users: number;
  revenue: number;
  delivered: number;
  pending: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  date: string | null;
}

export const ORDER_STATUSES = ['Confirmed', 'Paid', 'Shipped', 'Delivered', 'Cancelled'] as const;
