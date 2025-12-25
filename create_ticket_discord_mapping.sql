-- Add Discord thread mapping
CREATE TABLE IF NOT EXISTS ticket_discord_mapping (
    ticket_id UUID PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
    discord_thread_id VARCHAR(100) NOT NULL,
    discord_channel_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add discord_thread_id to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS discord_thread_id VARCHAR(100);

-- Enable RLS
ALTER TABLE ticket_discord_mapping ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all for service role
CREATE POLICY "Allow all for service role"
    ON ticket_discord_mapping FOR ALL
    USING (true);
