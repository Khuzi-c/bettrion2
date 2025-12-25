-- Support System Tables

-- 1. Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Null if guest or user deleted
    guest_email TEXT, -- For non-logged in users
    short_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    priority TEXT DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH
    status TEXT DEFAULT 'OPEN', -- OPEN, CLOSED, PAUSED
    description TEXT,
    discord_thread_id TEXT, -- For Discord integration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    sender_role TEXT CHECK (sender_role IN ('USER', 'ADMIN', 'SYSTEM')),
    content TEXT,
    attachments TEXT[], -- Array of URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ticket-Discord Mapping (Optional, good for quick lookups)
CREATE TABLE IF NOT EXISTS public.ticket_discord_mapping (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    discord_thread_id TEXT UNIQUE,
    discord_channel_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" 
ON public.tickets FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR user_id = (SELECT id FROM public.users WHERE user_id = auth.uid()));

-- Users can insert tickets
CREATE POLICY "Users can create tickets" 
ON public.tickets FOR INSERT 
TO authenticated 
WITH CHECK (true); -- Allow creation

-- Service Role has full access (default)
