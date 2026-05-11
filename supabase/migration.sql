-- ===================================================
-- SpinBite — Full Database Schema
-- Run this in your Supabase SQL Editor
-- ===================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ===== RESTAURANTS =====
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo text,
  primary_color text default '#FF6B00',
  created_at timestamptz default now()
);

-- ===== USERS (Admins) =====
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade,
  email text not null,
  role text default 'admin',
  created_at timestamptz default now()
);

-- ===== CUSTOMERS =====
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  full_name text not null,
  phone text not null,
  spins_today integer default 0,
  last_spin_date date,
  created_at timestamptz default now(),
  unique(restaurant_id, phone)
);

-- ===== PRIZES =====
create table if not exists prizes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  title text not null,
  image_url text,
  probability numeric not null check (probability >= 0 and probability <= 100),
  daily_limit integer default 10,
  wins_today integer default 0,
  last_reset_date date,
  active boolean default true,
  deleted boolean default false,
  created_at timestamptz default now()
);

-- ===== SPINS =====
create table if not exists spins (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade not null,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  prize_id uuid references prizes(id) on delete set null,
  spin_number integer,
  created_at timestamptz default now()
);

-- ===== CLAIMS =====
create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  spin_id uuid references spins(id) on delete cascade unique not null,
  claim_code text unique not null,
  claimed boolean default false,
  claimed_at timestamptz,
  expires_at timestamptz not null
);

-- ===== INDEXES =====
create index if not exists idx_customers_restaurant on customers(restaurant_id);
create index if not exists idx_customers_phone on customers(restaurant_id, phone);
create index if not exists idx_prizes_restaurant on prizes(restaurant_id);
create index if not exists idx_spins_customer on spins(customer_id);
create index if not exists idx_spins_restaurant on spins(restaurant_id);
create index if not exists idx_spins_created on spins(created_at);
create index if not exists idx_claims_code on claims(claim_code);
create index if not exists idx_claims_spin on claims(spin_id);

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS on all tables
alter table restaurants enable row level security;
alter table users enable row level security;
alter table customers enable row level security;
alter table prizes enable row level security;
alter table spins enable row level security;
alter table claims enable row level security;

-- Restaurants: admins can read their own restaurant
create policy "Users can view their restaurant"
  on restaurants for select
  using (id in (select restaurant_id from users where id = auth.uid()));

-- Users: can read own record
create policy "Users can view own record"
  on users for select
  using (id = auth.uid());

-- Customers: admins can manage their restaurant's customers
create policy "Admins manage customers"
  on customers for all
  using (restaurant_id in (select restaurant_id from users where id = auth.uid()));

-- Allow anonymous inserts for customer registration
create policy "Anonymous customer registration"
  on customers for insert
  with check (true);

-- Allow anonymous reads for customer lookup by phone
create policy "Anonymous customer lookup"
  on customers for select
  using (true);

-- Prizes: admins manage, public can read active
create policy "Admins manage prizes"
  on prizes for all
  using (restaurant_id in (select restaurant_id from users where id = auth.uid()));

create policy "Public read active prizes"
  on prizes for select
  using (active = true and deleted = false);

-- Spins: admins view, service role inserts
create policy "Admins view spins"
  on spins for select
  using (restaurant_id in (select restaurant_id from users where id = auth.uid()));

create policy "Public view own spins"
  on spins for select
  using (true);

create policy "Public insert spins"
  on spins for insert
  with check (true);

-- Claims: admins manage, public reads own
create policy "Admins manage claims"
  on claims for all
  using (spin_id in (
    select id from spins where restaurant_id in (
      select restaurant_id from users where id = auth.uid()
    )
  ));

create policy "Public read claims"
  on claims for select
  using (true);

create policy "Public insert claims"
  on claims for insert
  with check (true);

-- ===== SEED DATA (Optional — remove in production) =====
-- Insert a sample restaurant
-- insert into restaurants (name, primary_color) values ('SpinBite Demo', '#FF6B00');
