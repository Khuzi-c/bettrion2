-- Add User Stats Columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS vip_level TEXT DEFAULT 'Bronze',
ADD COLUMN IF NOT EXISTS total_wagered NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_deposited NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Log migration
INSERT INTO schema_migrations (version) VALUES ('v18_user_stats') ON CONFLICT DO NOTHING;
