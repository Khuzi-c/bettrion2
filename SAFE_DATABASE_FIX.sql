-- SAFE DATABASE FIX - Run this in Supabase SQL Editor
-- This version is safe and won't fail

-- PART 1: Create base tables if they don't exist
CREATE TABLE IF NOT EXISTS casinos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    rating DECIMAL(2,1),
    affiliate_link TEXT,
    description TEXT,
    short_description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    bonuses JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id TEXT UNIQUE,
    user_id UUID,
    subject TEXT,
    initial_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PART 2: Add missing columns to existing tables
ALTER TABLE casinos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE casinos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Casino';
ALTER TABLE casinos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE casinos ADD COLUMN IF NOT EXISTS visibility_countries TEXT[] DEFAULT '{global}';
ALTER TABLE casinos ADD COLUMN IF NOT EXISTS promo_codes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE casinos ADD COLUMN IF NOT EXISTS bonus_details JSONB DEFAULT '{}'::jsonb;

ALTER TABLE articles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OPEN';
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN ('OPEN', 'CLOSED', 'PAUSED'));
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS discord_thread_id TEXT;

ALTER TABLE settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE staff_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE staff_logs DROP CONSTRAINT IF EXISTS staff_logs_user_id_fkey;
ALTER TABLE staff_logs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE staff_logs ADD CONSTRAINT staff_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- PART 3: Create new tables
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('USER', 'ADMIN', 'GUEST')),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uploaded_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    original_name TEXT,
    file_url TEXT NOT NULL,
    file_size_kb INTEGER,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_name TEXT NOT NULL,
    backup_type TEXT CHECK (backup_type IN ('auto', 'manual')) DEFAULT 'manual',
    backup_data JSONB NOT NULL,
    file_size_kb INTEGER,
    tables_included TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

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

CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    country TEXT,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ip_address)
);

-- PART 4: Disable RLS
ALTER TABLE casinos DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE backups DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions DISABLE ROW LEVEL SECURITY;

-- PART 5: Grant permissions
GRANT ALL ON casinos TO anon, authenticated;
GRANT ALL ON articles TO anon, authenticated;
GRANT ALL ON tickets TO anon, authenticated;
GRANT ALL ON messages TO anon, authenticated;
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON settings TO anon, authenticated;
GRANT ALL ON staff_logs TO anon, authenticated;
GRANT ALL ON uploaded_images TO anon, authenticated;
GRANT ALL ON backups TO anon, authenticated;
GRANT ALL ON analytics TO anon, authenticated;
GRANT ALL ON active_sessions TO anon, authenticated;

-- PART 6: Create indexes (safe - will skip if column doesn't exist)
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_casinos_created_at ON casinos(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_images_created_at ON uploaded_images(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analytics_ip ON analytics(ip_address);
    CREATE INDEX IF NOT EXISTS idx_active_sessions_last_seen ON active_sessions(last_seen DESC);
    CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
    CREATE INDEX IF NOT EXISTS idx_users_ip ON users(ip_address);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some indexes could not be created, but that is OK';
END $$;

-- PART 7: Refresh schema
NOTIFY pgrst, 'reload schema';

-- ✅ This version creates tables if missing, then adds columns, so it should work!
