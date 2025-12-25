-- Create backups table and setup
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_name TEXT NOT NULL,
    backup_type TEXT CHECK (backup_type IN ('auto', 'manual')) DEFAULT 'manual',
    backup_data JSONB NOT NULL,
    file_size_kb INTEGER,
    tables_included TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Disable RLS
ALTER TABLE backups DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON backups TO anon, authenticated;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_type ON backups(backup_type);
