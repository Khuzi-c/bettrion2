const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Try to use SERVICE_ROLE_KEY if available, else standard key
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(process.env.SUPABASE_URL, key);

async function run() {
    console.log('--- Disabling RLS on Messages Table ---');

    const sql = `
        ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY; 
    `;

    // Try RPC first (if function exists)
    const { error } = await supabase.rpc('run_sql', { sql });

    if (error) {
        console.error('RPC Error:', error);
        console.log('If run_sql does not exist, you must run this SQL manually in Supabase Dashboard SQL Editor:');
        console.log(sql);
    } else {
        console.log('✅ Success! RLS Disabled on tickets/messages.');
    }
}

run();
