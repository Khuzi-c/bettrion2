-- Add Phone Auth Columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;

-- Make email nullable if needed? Or we stick to placeholder emails for now.
-- ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
