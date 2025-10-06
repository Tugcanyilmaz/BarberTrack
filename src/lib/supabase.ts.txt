import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee';
  shop_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceType = {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  employee_id: string;
  service_type_id: string;
  performed_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionWithDetails = Transaction & {
  service_types: ServiceType;
  profiles: Profile;
};
