const supabase = require('./backend/config/supabase');
require('dotenv').config();

async function check() {
    console.log('--- SYSTEM CHECK ---');

    // 1. Check DB Connection & Casinos
    try {
        const { data, error, count } = await supabase.from('casinos').select('*', { count: 'exact' });
        if (error) {
            console.error('❌ DB Error:', error.message);
        } else {
            console.log(`✅ DB Connected. Found ${count} casinos.`);
            if (data.length > 0) {
                console.log('Sample Casino:', { name: data[0].name, is_active: data[0].is_active, visibility: data[0].visibility_countries });

                // Check Active Count
                const active = data.filter(c => c.is_active);
                console.log(`✅ Active Casinos: ${active.length}`);
            } else {
                console.warn('⚠️ No casinos in table!');
            }
        }
    } catch (e) {
        console.error('❌ Crash accessing DB:', e.message);
    }

    // 2. Check Users
    try {
        const { count } = await supabase.from('users').select('*', { count: 'exact' });
        console.log(`✅ Users Count: ${count}`);
    } catch (e) {
        console.error('❌ User Check Failed:', e.message);
    }

    console.log('--- END CHECK ---');
}

check();
