-- Add IP and Country tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;
