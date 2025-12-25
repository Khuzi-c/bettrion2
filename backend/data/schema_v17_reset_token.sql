-- Add Reset Token columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMPTZ DEFAULT NULL;

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
