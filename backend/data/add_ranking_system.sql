-- Add Ranking and Exclusive columns
ALTER TABLE public.casinos 
ADD COLUMN IF NOT EXISTS ranking integer DEFAULT 999,
ADD COLUMN IF NOT EXISTS is_exclusive boolean DEFAULT false;

-- Index for faster sorting
CREATE INDEX IF NOT EXISTS casinos_ranking_idx ON public.casinos (ranking ASC);
CREATE INDEX IF NOT EXISTS casinos_exclusive_idx ON public.casinos (is_exclusive);
