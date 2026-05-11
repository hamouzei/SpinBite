/* ===================================================
   SpinBite — Database Types
   Auto-generated from Supabase schema + manual types
   =================================================== */

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: Restaurant;
        Insert: Omit<Restaurant, "id" | "created_at">;
        Update: Partial<Omit<Restaurant, "id">>;
      };
      users: {
        Row: User;
        Insert: Omit<User, "created_at">;
        Update: Partial<Omit<User, "id">>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, "id" | "created_at" | "spins_today" | "last_spin_date">;
        Update: Partial<Omit<Customer, "id">>;
      };
      prizes: {
        Row: Prize;
        Insert: Omit<Prize, "id" | "created_at" | "wins_today" | "last_reset_date">;
        Update: Partial<Omit<Prize, "id">>;
      };
      spins: {
        Row: Spin;
        Insert: Omit<Spin, "id" | "created_at">;
        Update: Partial<Omit<Spin, "id">>;
      };
      claims: {
        Row: Claim;
        Insert: Omit<Claim, "id">;
        Update: Partial<Omit<Claim, "id">>;
      };
    };
  };
}

/* ===== Table Row Types ===== */

export interface Restaurant {
  id: string;
  name: string;
  logo: string | null;
  primary_color: string;
  created_at: string;
}

export interface User {
  id: string;
  restaurant_id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Customer {
  id: string;
  restaurant_id: string;
  full_name: string;
  phone: string;
  spins_today: number;
  last_spin_date: string | null;
  created_at: string;
}

export interface Prize {
  id: string;
  restaurant_id: string;
  title: string;
  image_url: string | null;
  probability: number;
  daily_limit: number;
  wins_today: number;
  last_reset_date: string | null;
  active: boolean;
  created_at: string;
}

export interface Spin {
  id: string;
  customer_id: string;
  restaurant_id: string;
  prize_id: string | null;
  spin_number: number;
  created_at: string;
}

export interface Claim {
  id: string;
  spin_id: string;
  claim_code: string;
  claimed: boolean;
  claimed_at: string | null;
  expires_at: string;
}

/* ===== Extended Types (with relations) ===== */

export interface SpinWithPrize extends Spin {
  prize: Prize | null;
}

export interface SpinWithClaim extends Spin {
  prize: Prize | null;
  claim: Claim | null;
}

export interface CustomerWithStats extends Customer {
  total_spins: number;
  rewards_won: number;
  last_activity: string;
}

/* ===== API Types ===== */

export interface SpinResult {
  prize_id: string;
  prize_title: string;
  image_url: string | null;
  claim_code: string;
  expires_at: string;
  spins_remaining: number;
}

export interface SpinError {
  error: "limit_reached" | "no_prizes" | "invalid_customer" | "server_error";
  message: string;
}

/* ===== Form Types ===== */

export interface RegisterFormData {
  full_name: string;
  phone: string;
}

export interface PrizeFormData {
  title: string;
  image_url: string;
  probability: number;
  daily_limit: number;
  active: boolean;
}
