-- FIX FOREIGN KEY ERROR
-- Your 'users' table is trying to link to Supabase Auth, but we are using Custom Auth.
-- We must remove this restriction to allow new users to be created.

-- 1. Drop the constraint that blocks registration
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 2. Ensure ID is a Primary Key (if not already)
-- Just to be safe, though likely already is.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_pkey') THEN
        ALTER TABLE public.users ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 3. Reload Schema to apply changes immediately
NOTIFY pgrst, 'reload schema';
