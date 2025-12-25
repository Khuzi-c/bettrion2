const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function run() {
    console.log('Adding discord_user_id to tickets table...');

    const { error } = await supabase.rpc('run_sql', {
        sql: `
            ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS discord_user_id TEXT;
        `
    });

    if (error) {
        console.error('RPC Error:', error);
        console.log('--- MANUAL SQL REQUIRED ---');
        console.log('ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS discord_user_id TEXT;');
    } else {
        console.log('✅ Success! Column added.');
    }
}

run();
