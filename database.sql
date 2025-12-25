-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3.1. Users Table (public.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY, -- Links to Supabase Auth
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'admin', 'moderator', 'user'
  discord_id TEXT, -- For linking Discord accounts
  banned BOOLEAN DEFAULT false,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2. Casinos Table (public.casinos)
CREATE TABLE IF NOT EXISTS public.casinos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,          -- e.g., "HolyLuck"
  slug TEXT UNIQUE NOT NULL,   -- e.g., "holyluck-casino"
  rating NUMERIC(3, 1) DEFAULT 0, -- 0.0 to 5.0
  affiliate_link TEXT,         -- The money link
  description TEXT,            -- HTML detailed review
  short_description TEXT,      -- "200% Welcome Bonus..."
  
  -- Flexible Fields
  bonuses JSONB DEFAULT '{}',  
  -- Structure: { "welcome": "200%", "spins": "50", "code": "FALL200" }
  
  images TEXT[] DEFAULT ARRAY[]::TEXT[], 
  -- images[0] is strictly treated as the LOGO
  -- images[1..n] are gallery screenshots
  
  visibility_countries TEXT[] DEFAULT ARRAY['global'], -- Geo-targeting
  is_active BOOLEAN DEFAULT true, -- Soft delete
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3. Support System Tables
-- Tickets (public.tickets)
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id), -- Nullable for Guests
  guest_email TEXT, -- If user_id is null
  subject TEXT,
  category TEXT, -- 'Payment', 'Kyc', 'Bug'
  priority TEXT DEFAULT 'Low', -- 'Low', 'High', 'Critical'
  status TEXT DEFAULT 'OPEN', -- 'OPEN', 'PENDING', 'CLOSED'
  discord_thread_id TEXT, -- ID of the private Discord thread
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (public.messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL, -- 'USER', 'ADMIN', 'SYSTEM'
  content TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IMPORTANT: Enable Realtime on this table!
-- This command might need to be run in the SQL editor or Dashboard UI if 'supabase_realtime' publication exists
-- alter publication supabase_realtime add table messages;
