DO $$ 
BEGIN 
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
    
    -- Add avatar if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar') THEN
        ALTER TABLE users ADD COLUMN avatar TEXT;
    END IF;

END $$;
