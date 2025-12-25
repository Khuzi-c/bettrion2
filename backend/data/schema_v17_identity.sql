-- Migration v17: Identity Linking
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_pending_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_verification_code TEXT;

-- Index for searching by discord_id
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
