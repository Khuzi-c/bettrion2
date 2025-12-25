-- Create ADS table for Banner/Sidebar Ads
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position VARCHAR(50) NOT NULL, -- 'header', 'sidebar', 'footer', 'home_banner', etc.
    title VARCHAR(255),            -- Internal name or public title
    image_url TEXT NOT NULL,       -- Banner Image
    link_url TEXT,                 -- Redirect URL
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policies (Enable RLS later, for now allow public read, admin write)
-- INSERT INTO ads (position, title, image_url, link_url) VALUES ('sidebar', 'Welcome Bonus', '/assets/img/ads/banner1.jpg', '/promotions');
