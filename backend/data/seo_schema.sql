-- Add SEO columns to casinos table
ALTER TABLE public.casinos 
ADD COLUMN IF NOT EXISTS seo_title text,
ADD COLUMN IF NOT EXISTS seo_description text,
ADD COLUMN IF NOT EXISTS keywords text;

-- Add SEO columns to articles table (for future use/completeness)
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS seo_title text,
ADD COLUMN IF NOT EXISTS seo_description text,
ADD COLUMN IF NOT EXISTS keywords text;

-- Notify
DO $$
BEGIN
    RAISE NOTICE 'SEO columns added successfully';
END $$;
