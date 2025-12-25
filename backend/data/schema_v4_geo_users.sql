-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. IP Logs Table
create table if not exists public.ip_logs (
    id uuid default uuid_generate_v4() primary key,
    ip text not null,
    country_code text,
    country_name text,
    city text,
    region text,
    timezone text,
    currency text,
    isp text,
    org text,
    asn text,
    latitude numeric,
    longitude numeric,
    user_agent text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ip_logs enable row level security;
create policy "Admins can view all ip logs" on public.ip_logs for select using (true); -- Simplified for now
create policy "Server can insert ip logs" on public.ip_logs for insert with check (true);

-- 2. Users Table
create table if not exists public.users (
    id uuid default uuid_generate_v4() primary key,
    user_id text unique not null, -- The cookie/localStorage UUID
    first_ip text,
    last_ip text,
    country_code text,
    language text,
    status text default 'active' check (status in ('active', 'banned', 'restricted')),
    admin_note text,
    is_admin boolean default false,
    first_seen timestamp with time zone default timezone('utc'::text, now()) not null,
    last_seen timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;
create policy "Admins can view all users" on public.users for select using (true);
create policy "Server can manage users" on public.users for all using (true);

-- 3. Country Rules Table
create table if not exists public.country_rules (
    country_code text primary key,
    country_name text,
    status text default 'allowed' check (status in ('allowed', 'blocked', 'restricted')),
    reason text,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.country_rules enable row level security;
create policy "Public read access" on public.country_rules for select using (true);
create policy "Admins can manage rules" on public.country_rules for all using (true);

-- 4. Translations Cache Table
create table if not exists public.translations_cache (
    id uuid default uuid_generate_v4() primary key,
    language_code text not null,
    key_name text not null,
    value text not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    unique(language_code, key_name)
);

-- Enable RLS
alter table public.translations_cache enable row level security;
create policy "Public read access" on public.translations_cache for select using (true);
create policy "Admins can manage translations" on public.translations_cache for all using (true);

-- Indexes for performance
create index if not exists idx_ip_logs_ip on public.ip_logs(ip);
create index if not exists idx_users_user_id on public.users(user_id);
create index if not exists idx_users_status on public.users(status);
create index if not exists idx_translations_lang on public.translations_cache(language_code);
