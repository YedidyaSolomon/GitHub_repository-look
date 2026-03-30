import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isMockMode } from "./mock/flags";
import { createMockSupabaseClient } from "./mock/supabase-mock";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Mock client is browser-only so server/API routes keep using the real Supabase client. */
const useMockClient =
  isMockMode() && typeof window !== "undefined";

function createServerOrProductionClient(): SupabaseClient {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  if (isMockMode()) {
    // Demo: avoid crashing SSR/API module load if only NEXT_PUBLIC_USE_MOCK is set.
    return createClient("https://placeholder.supabase.co", "mock-anon-key-not-used");
  }
  throw new Error("Missing Supabase environment variables");
}

export const supabase: SupabaseClient = useMockClient
  ? (createMockSupabaseClient() as unknown as SupabaseClient)
  : createServerOrProductionClient();

export { isMockMode } from "./mock/flags";
export { resetMockDatabase } from "./mock/db-state";

// Type definitions for database schema
export type Profile = {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string | null;
  role: "ADMIN" | "BUSINESS" | "CUSTOMER";
  created_at?: string;
  updated_at?: string;
};

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  /** Discovery filter; mock seed mirrors physical_address */
  address?: string | null;
  physical_address?: string;
  latitude?: number | null;
  longitude?: number | null;
  tin?: string;
  logo_url?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  subscription_status?: "INACTIVE" | "ACTIVE";
  is_active_subscription?: boolean;
  subscription_plan?: "MONTHLY" | "YEARLY" | "QUARTERLY" | null;
  rejection_reason?: string | null;
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
  category?: string;
  specialist?: string;
  image_urls?: string[];
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
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  created_at: string;
  updated_at: string;
};
