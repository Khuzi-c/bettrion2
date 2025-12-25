-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    background_color VARCHAR(20) DEFAULT '#dc2626',
    text_color VARCHAR(20) DEFAULT '#ffffff',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active announcements
CREATE POLICY "Anyone can view active announcements"
    ON announcements FOR SELECT
    USING (is_active = true);

-- Policy: Allow all operations (for admin use)
CREATE POLICY "Allow all for service role"
    ON announcements FOR ALL
    USING (true);
