const supabase = require('../config/supabase');

async function checkCasinos() {
    console.log('Checking Supabase connection...');
    try {
        const { data, error, count } = await supabase
            .from('casinos')
            .select('*', { count: 'exact' });

        if (error) {
            console.error('❌ Error querying casinos:', error.message);
            console.error('Full Error:', error);
        } else {
            console.log(`✅ Success! Found ${count} casinos.`);
            if (data.length > 0) {
                console.log('--- First Casino Sample ---');
                console.log(JSON.stringify(data[0], null, 2));
            } else {
                console.log('⚠️ Table is empty.');
            }
        }
    } catch (e) {
        console.error('EXCEPTION:', e);
    }
}

checkCasinos();
