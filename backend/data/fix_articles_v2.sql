-- FORCE FIX ARTICLES TABLE
-- Run this in Supabase SQL Editor

-- 1. Add is_active if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'is_active') THEN
        ALTER TABLE articles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 2. Add other potential missing columns just in case
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'slug') THEN
        ALTER TABLE articles ADD COLUMN slug TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'thumbnail') THEN
        ALTER TABLE articles ADD COLUMN thumbnail TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'tags') THEN
        ALTER TABLE articles ADD COLUMN tags TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'author') THEN
        ALTER TABLE articles ADD COLUMN author TEXT;
    END IF;
END $$;

-- 3. Verify Casinos Table columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casinos' AND column_name = 'is_active') THEN
        ALTER TABLE casinos ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'casinos' AND column_name = 'category') THEN
        ALTER TABLE casinos ADD COLUMN category TEXT DEFAULT 'Casino';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
