-- Additions for Bettrion V2 functionality

-- 1. Articles Table (Blog/News)
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    thumbnail TEXT,
    content TEXT, -- HTML content
    category_id UUID, -- Link to category if needed
    countries_visible TEXT[] DEFAULT ARRAY['global'],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    views INTEGER DEFAULT 0
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'platform', -- 'platform' or 'article'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Analytics Table (Detailed logs)
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL, -- 'view' or 'click'
    item_type TEXT, -- 'platform' or 'article'
    item_id UUID, -- Can reference different tables, so no strict FK constraint enforced here for simplicity or use polymorphic association
    ip_address TEXT,
    country TEXT,
    device TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Providers Table (Game Providers)
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Updates to Casinos (Platforms) table to match V2 fields
-- Check if columns exist before adding to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='casinos' AND column_name='logo') THEN
        ALTER TABLE public.casinos ADD COLUMN logo TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='casinos' AND column_name='banner') THEN
        ALTER TABLE public.casinos ADD COLUMN banner TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='casinos' AND column_name='views') THEN
        ALTER TABLE public.casinos ADD COLUMN views INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='casinos' AND column_name='clicks') THEN
        ALTER TABLE public.casinos ADD COLUMN clicks INTEGER DEFAULT 0;
    END IF;
    -- Map 'features' from V2 to 'bonuses' or new column? Using bonuses for now.
END $$;
