-- Activity Logs and Button Tracking Database Schema
-- Run this in Supabase SQL Editor

-- 1. Create activity_logs table for system-wide event tracking
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- 'backup', 'casino_added', 'slot_deleted', 'user_online', etc.
    event_category TEXT NOT NULL, -- 'system', 'content', 'user', 'admin'
    description TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create button_clicks table for tracking button interactions
CREATE TABLE IF NOT EXISTS button_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    button_id TEXT NOT NULL, -- unique identifier for the button
    button_label TEXT,
    page_url TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Disable RLS
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE button_clicks DISABLE ROW LEVEL SECURITY;

-- 4. Grant permissions
GRANT ALL ON activity_logs TO anon, authenticated;
GRANT ALL ON button_clicks TO anon, authenticated;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type ON activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON activity_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_button_clicks_created_at ON button_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_button_clicks_button_id ON button_clicks(button_id);
CREATE INDEX IF NOT EXISTS idx_button_clicks_page_url ON button_clicks(page_url);

-- 6. Refresh schema
NOTIFY pgrst, 'reload schema';

-- ✅ Activity logging and button tracking tables created!
