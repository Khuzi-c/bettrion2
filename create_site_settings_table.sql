-- Add maintenance mode setting
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(100)
);

-- Insert default maintenance mode setting
INSERT INTO site_settings (setting_key, setting_value, updated_by)
VALUES ('maintenance_mode', 'false', 'System')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read settings
CREATE POLICY "Anyone can view settings"
    ON site_settings FOR SELECT
    USING (true);

-- Policy: Allow all operations for service role
CREATE POLICY "Allow all for service role"
    ON site_settings FOR ALL
    USING (true);
