-- Run this in your Supabase SQL Editor

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text,
  message text not null,
  type text default 'info'::text,
  link_text text,
  link_url text,
  color text default '#3498db'::text,
  is_active boolean default true
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Enable read access for all users" on public.notifications for select using (true);
create policy "Enable insert for authenticated users only" on public.notifications for insert with check (true); 
create policy "Enable update for authenticated users only" on public.notifications for update using (true);
create policy "Enable delete for authenticated users only" on public.notifications for delete using (true);
-- Note: If your backend uses the SERVICE_ROLE key, it will bypass these policies automatically.
