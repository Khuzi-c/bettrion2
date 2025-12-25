-- V5 Schema: Google Auth Expansion

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS access_token TEXT, -- Optional: cache google access token
ADD COLUMN IF NOT EXISTS refresh_token TEXT;

-- Update Last Login default
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT NOW();
