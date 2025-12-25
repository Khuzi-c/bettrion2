const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * Log an activity event
 */
async function logActivity(eventType, description, options = {}) {
    try {
        const { user_id, ip_address, metadata, category } = options;

        await supabase.from('activity_logs').insert([{
            event_type: eventType,
            event_category: category || 'system',
            description,
            user_id: user_id || null,
            ip_address: ip_address || null,
            metadata: metadata || {}
        }]);
    } catch (err) {
        console.error('Activity log error:', err);
    }
}

/**
 * Get recent activity logs
 */
exports.getActivityLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const category = req.query.category;

        let query = supabase
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (category) {
            query = query.eq('event_category', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Track button click
 */
exports.trackButtonClick = async (req, res) => {
    try {
        const { button_id, button_label, page_url } = req.body;
        const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

        // Get country from IP
        let country = 'Unknown';
        try {
            const ipRes = await fetch(`https://ipapi.co/${ip_address}/json/`);
            const ipData = await ipRes.json();
            country = ipData.country_name || 'Unknown';
        } catch (e) {
            // Silently fail
        }

        await supabase.from('button_clicks').insert([{
            button_id,
            button_label,
            page_url,
            ip_address,
            country
        }]);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Get button click statistics
 */
exports.getButtonStats = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('button_clicks')
            .select('button_id, button_label, count')
            .order('count', { ascending: false });

        if (error) throw error;

        // Aggregate clicks by button_id
        const stats = {};
        const { data: clicks } = await supabase
            .from('button_clicks')
            .select('button_id, button_label');

        clicks.forEach(click => {
            if (!stats[click.button_id]) {
                stats[click.button_id] = {
                    button_id: click.button_id,
                    button_label: click.button_label,
                    clicks: 0
                };
            }
            stats[click.button_id].clicks++;
        });

        const result = Object.values(stats).sort((a, b) => b.clicks - a.clicks);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Export logging function for use in other controllers
exports.logActivity = logActivity;
