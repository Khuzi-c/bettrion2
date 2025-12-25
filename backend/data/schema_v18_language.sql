-- Add Language Preference to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Optional: Index if we query by language often (not really needed but good practice)
-- CREATE INDEX IF NOT EXISTS idx_users_language ON users(language);
