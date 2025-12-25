-- V2.2 Schema Update for Slots and Professional Features

-- 1. Slots Table
CREATE TABLE IF NOT EXISTS public.slots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    provider_id UUID, -- References providers.id manually or FK
    slug TEXT UNIQUE NOT NULL,
    rtp DECIMAL(5,2), -- 96.50
    volatility TEXT, -- 'High', 'Medium', 'Low'
    max_win TEXT, -- 'x5000'
    thumbnail TEXT,
    demo_url TEXT, -- iframe link
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update Casinos for Ranking/Ads
ALTER TABLE public.casinos 
ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0, -- Higher number = Higher in list
ADD COLUMN IF NOT EXISTS geo_targets TEXT[] DEFAULT '{global}'; -- For GEO filtering

-- 3. Ensure Providers Table matches usage
-- (Already created in V2 update, just verifying standard columns usage)
-- id, name, logo
