-- Auto Translation System Cache Table
-- Used to store translated strings to avoid repeated API calls to LibreTranslate

CREATE TABLE IF NOT EXISTS public.translations_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_hash TEXT NOT NULL, -- MD5 or SHA256 of original_text for fast lookup
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    source_language TEXT DEFAULT 'en',
    target_language TEXT NOT NULL,
    context TEXT, -- 'ui', 'db', 'article', 'dynamic'
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_translations_hash_lang ON public.translations_cache(source_hash, target_language);

-- Enable RLS
ALTER TABLE public.translations_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read translations (needed for frontend)
CREATE POLICY "Public can view translations" 
ON public.translations_cache FOR SELECT 
USING (true);

-- Allow service role (backend) to insert/update (default bypass RLS)
