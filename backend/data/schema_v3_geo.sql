-- V3 Schema: Geo & Users Management

-- 1. Users Table (Tracks unique visitors)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ip_address TEXT, -- Most recent IP
    country_code TEXT, -- e.g. US, DE
    language TEXT, -- e.g. en, de
    geo_data JSONB, -- Full dump from provider
    status TEXT DEFAULT 'active', -- active, banned, restricted
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. IP Logs (History of all connections)
CREATE TABLE IF NOT EXISTS public.ip_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    ip_address TEXT,
    country TEXT,
    city TEXT,
    region TEXT,
    language TEXT,
    currency TEXT,
    timezone TEXT,
    asn TEXT,
    isp TEXT,
    lat NUMERIC,
    lng NUMERIC,
    full_response JSONB,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Blocked Countries (Rules)
CREATE TABLE IF NOT EXISTS public.blocked_countries (
    country_code TEXT PRIMARY KEY,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speed
CREATE INDEX IF NOT EXISTS idx_users_ip ON public.users(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_logs_user ON public.ip_logs(user_id);
