-- 1. Create Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    background_color TEXT DEFAULT '#dc2626',
    text_color TEXT DEFAULT '#ffffff',
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active announcements
CREATE POLICY "Public can view active announcements" 
ON public.announcements FOR SELECT 
USING (is_active = true);

-- Policy: Admins can do everything (Service Role bypasses this, but good to have)
-- (Assuming auth.uid() check or role check for future)

-- 2. Cleanup Fake Users (Requested Fix)
-- Delete users who have NO email AND NO google_id (Anonymous visitors)
DELETE FROM public.users 
WHERE email IS NULL 
AND google_id IS NULL;

-- Optional: Add constraint to prevent future anonymous inserts if middleware fails
-- ALTER TABLE public.users ADD CONSTRAINT users_must_have_auth CHECK (email IS NOT NULL OR google_id IS NOT NULL);
