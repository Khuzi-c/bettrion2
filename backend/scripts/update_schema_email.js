const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

async function run() {
    console.log('Adding email_preferences to users table...');

    const { error } = await supabase.rpc('run_sql', {
        sql: `
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{"marketing": true, "updates": true, "security": true}';
        `
    });

    if (error) {
        console.error('RPC Error:', error);
        console.log('--- MANUAL SQL REQUIRED ---');
        console.log(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{"marketing": true, "updates": true, "security": true}';`);
    } else {
        console.log('✅ Success! Column added.');
    }
}

run();
