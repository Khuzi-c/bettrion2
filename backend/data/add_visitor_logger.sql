-- Create Visitors Table with User Tracking
CREATE TABLE IF NOT EXISTS public.visitors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL, -- Link to users
    ip text,
    ip_hash text,
    ip_anonymized boolean DEFAULT true,
    path text,
    method text,
    user_agent text,
    referrer text,
    headers jsonb,
    country text,
    region text,
    city text,
    latitude numeric,
    longitude numeric,
    asn text,
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS visitors_created_at_idx ON public.visitors (created_at DESC);
CREATE INDEX IF NOT EXISTS visitors_country_idx ON public.visitors (country);
CREATE INDEX IF NOT EXISTS visitors_user_id_idx ON public.visitors (user_id);
