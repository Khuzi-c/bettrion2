DO $$ 
BEGIN 
    -- Create analytics table if not exists
    CREATE TABLE IF NOT EXISTS analytics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        ip_address TEXT,
        country TEXT,
        page_url TEXT,
        user_agent TEXT,
        referrer TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create active_sessions table if not exists
    CREATE TABLE IF NOT EXISTS active_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        ip_address TEXT UNIQUE,
        country TEXT,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable RLS (Security) but allow insert for public analytics
    ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow Public Insert Analytics" ON analytics FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow Admin Select Analytics" ON analytics FOR SELECT USING (true); -- Ideally restrict to admin role

    ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow Public Upsert Sessions" ON active_sessions FOR INSERT WITH CHECK (true); -- Needs ON CONFLICT support
    CREATE POLICY "Allow Public Update Sessions" ON active_sessions FOR UPDATE USING (true);
    CREATE POLICY "Allow Admin Select Sessions" ON active_sessions FOR SELECT USING (true);
    
    -- Add is_verified if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add verification_code if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_code') THEN
        ALTER TABLE users ADD COLUMN verification_code TEXT;
    END IF;
    
    -- Add verification_expires if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_expires') THEN
        ALTER TABLE users ADD COLUMN verification_expires TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add google_id if not exists (for Google Auth)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_id') THEN
        ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
    END IF;

END $$;
