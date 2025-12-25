const supabase = require('./config/supabase');

async function seedNotification() {
    try {
        const { data, error } = await supabase.from('notifications').insert([
            {
                title: 'BETTRION',
                message: 'New Affiliate System is Out Now! Go Enjoy the Money Perks!',
                type: 'info',
                color: '#9b59b6',
                is_active: true
            }
        ]);
        if (error) console.error('Seed Error:', error.message);
        else console.log('✅ Seeded Notification');
    } catch (e) {
        console.error(e);
    }
}

seedNotification();
