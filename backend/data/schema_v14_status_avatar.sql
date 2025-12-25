-- 1. Create Site Settings Table (Key-Value Store)
CREATE TABLE IF NOT EXISTS public.site_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings (needed for status page, maintenance mode, etc.)
CREATE POLICY "Public Read Settings" ON public.site_settings FOR SELECT USING (true);

-- Allow admins (or service role) to update
-- (Service role bypasses RLS, so mainly for explicit admin users if row-level checks used)


-- 2. Update Users Table for Avatar & Notifications
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;


-- 3. Seed Default Status Settings
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES 
    ('system_status', 'operational'),
    ('system_status_message', 'All systems are operational.'),
    ('top_lists', '{"top3": [], "top10": []}')
ON CONFLICT (setting_key) DO NOTHING;
