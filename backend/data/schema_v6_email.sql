-- EMAIL SYSTEM SCHEMA

-- 1. Subscribers Table
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' -- active, unsubscribed
);

-- 2. Sent Emails Log
CREATE TABLE IF NOT EXISTS public.sent_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    status TEXT DEFAULT 'sent', -- sent, failed
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_sent_emails_to ON public.sent_emails(to_email);
