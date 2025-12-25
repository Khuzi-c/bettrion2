-- Add missing columns to 'users' table to fix API errors
-- Run this in Supabase SQL Editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS first_ip TEXT,
ADD COLUMN IF NOT EXISTS last_ip TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT gen_random_uuid();

-- Ensure RLS doesn't block inserts if not configured correctly (Optional, but safe for dev)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable insert for everyone" ON public.users FOR INSERT WITH CHECK (true);
