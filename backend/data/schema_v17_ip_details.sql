-- Add Rich IP Details support to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ip_full_details JSONB,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS isp TEXT;

-- Index for faster lookup by IP if needed later
CREATE INDEX IF NOT EXISTS idx_users_ip_address ON users(ip_address);
