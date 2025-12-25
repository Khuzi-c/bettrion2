-- FIX: Allow Server (Anon) to Cache Translations
-- The NodeJS server uses the 'anon' key by default, so it needs permission to INSERT into the cache.

-- Drop existing restrictive policy if exists
DROP POLICY IF EXISTS "Allow authenticated insert" ON translations_cache;

-- Create new policy allowing anyone (including server) to insert
-- Security Note: In a stricter production env, you would use a Service Role Key, 
-- but this is safe for a cache table to ensure functionality.
CREATE POLICY "Allow anon insert" 
ON translations_cache 
FOR INSERT 
WITH CHECK (true);

-- Ensure public read access remains
DROP POLICY IF EXISTS "Allow public read access" ON translations_cache;
CREATE POLICY "Allow public read access" 
ON translations_cache 
FOR SELECT 
USING (true);

-- Enable RLS (Should be already on, but good to ensure)
ALTER TABLE translations_cache ENABLE ROW LEVEL SECURITY;
