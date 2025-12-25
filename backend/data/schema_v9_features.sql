-- 1. Create Promotions Table
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    bonus_code TEXT,
    link TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update Users Table for Advanced Features
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'; -- admin/user/moderator

-- 3. Security Policies (RLS) - Optional but recommended
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active promotions
CREATE POLICY "Public can view active promotions" 
ON public.promotions FOR SELECT 
USING (is_active = true);

-- Allow admins full access (checking role or just service role)
-- Note: Service Role (backend) bypasses RLS, so this is mainly for client-side if used.

-- 4. Create Index
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active);
