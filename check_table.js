require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkTable() {
    console.log('Checking notifications table...');
    const { data, error } = await supabase.from('notifications').select('*').limit(1);

    if (error) {
        console.error('Error selecting from notifications:', error);
        if (error.code === 'PGRST204' || error.message.includes('relation "notifications" does not exist')) {
            console.log('CONCLUSION: Table "notifications" is MISSING.');
        }
    } else {
        console.log('Success! Table exists. Row count:', data.length);
    }
}

checkTable();
