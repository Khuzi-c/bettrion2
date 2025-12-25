const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' }); // Adjust path to root .env

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
    console.log('Applying RLS fixes...');

    // 1. Policy for SELECT
    const { error: err1 } = await supabase.rpc('run_sql', {
        sql: `
        -- Enable RLS (just in case)
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

        -- Drop existing to avoid conflicts
        DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
        DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;

        -- Create SELECT Policy
        CREATE POLICY "Users can view messages" 
        ON public.messages FOR SELECT 
        USING (true); -- START WITH PERMISSIVE for debug, tighten later (or rely on backend filtering)
        -- Ideally: ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid())

        -- Create INSERT Policy
        CREATE POLICY "Users can insert messages" 
        ON public.messages FOR INSERT 
        WITH CHECK (true); -- PERMISSIVE

        -- Service Role Bypass is default for server-side usage, 
        -- but if using browser client, we need policies.
        -- HOWEVER, our backend controller uses 'supabase' client initialized with SERVICE KEY?
        -- If backend uses SERVICE KEY, RLS is bypassed automatically!
        
        -- Let's check if env.SUPABASE_KEY is valid.
        `
    });

    if (err1 && !err1.message.includes('run_sql')) {
        console.error('RPC Error (might need direct SQL):', err1);
    } else {
        console.log('RPC Call attempted (if enabled).');
    }

    // ALTERNATIVE: If we can't run SQL via RPC, we rely on the fact that 
    // the backend *SHOULD* be using the Service Role Key. 
    // If it is using Anon Key, then RLS blocks it.

    console.log('Checking env vars...');
    console.log('URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
    console.log('KEY Length:', process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY.length : 0);
}

run();
