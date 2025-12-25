-- Add detailed fields to casinos table

-- Change review_article_id to BIGINT because articles.id is BIGINT/SERIAL
ALTER TABLE casinos 
ADD COLUMN IF NOT EXISTS pros TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cons TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS review_article_id BIGINT REFERENCES articles(id) ON DELETE SET NULL;

-- Ensure banner exists (if not already)
ALTER TABLE casinos 
ADD COLUMN IF NOT EXISTS banner TEXT;
