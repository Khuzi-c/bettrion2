const supabase = require('./backend/config/supabase');

async function promote() {
    const userId = 'dbe1d653-b5a7-473e-8862-3819088a1f8c';

    console.log(`Promoting user ${userId} to admin...`);

    const { data, error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', userId)
        .select();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success! User updated:', data);
    }
}

promote();
