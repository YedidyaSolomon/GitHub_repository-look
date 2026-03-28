import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for database schema
export type Profile = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'ADMIN' | 'BUSINESS' | 'CUSTOMER';
  created_at?: string;
  updated_at?: string;
};

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  physical_address?: string;
  tin?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  subscription_status?: 'INACTIVE' | 'ACTIVE';
  is_active_subscription?: boolean;
  subscription_plan?: 'MONTHLY' | 'YEARLY' | null;
  created_at?: string;
  updated_at?: string;
};

export type Service = {
  id: string;
  business_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  created_at: string;
  updated_at: string;
};

export type Specialist = {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone: string;
  availability: boolean;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  service_id: string;
  specialist_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booked_by: string | null;
  booking_date: string;
  booking_time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
};
