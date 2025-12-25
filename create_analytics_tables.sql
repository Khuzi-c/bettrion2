-- Analytics and User Tracking Tables
-- Run this in Supabase SQL Editor

-- 1. Create analytics table for visit tracking
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    country TEXT,
    city TEXT,
    page_url TEXT NOT NULL,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create active_sessions table for real-time tracking
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    country TEXT,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ip_address)
);

-- 3. Update users table with tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- 4. Update tickets table with IP tracking
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS country TEXT;

-- 5. Disable RLS
ALTER TABLE analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions DISABLE ROW LEVEL SECURITY;

-- 6. Grant permissions
GRANT ALL ON analytics TO anon, authenticated;
GRANT ALL ON active_sessions TO anon, authenticated;

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_ip ON analytics(ip_address);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_seen ON active_sessions(last_seen DESC);

-- 8. Auto-cleanup old analytics (keep last 30 days)
-- You can run this periodically or set up a cron job
-- DELETE FROM analytics WHERE created_at < NOW() - INTERVAL '30 days';

-- Done!
