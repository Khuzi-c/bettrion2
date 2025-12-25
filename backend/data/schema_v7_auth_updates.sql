-- Add password_hash to users table for standard auth
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Ensure email is unique if it wasn't already (it should be from previous steps, but good to ensure)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
