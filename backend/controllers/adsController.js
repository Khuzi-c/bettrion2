const supabase = require('../config/supabase');

const adsController = {
    // PUBLIC: Get active ads by position
    getAds: async (req, res) => {
        try {
            const { position } = req.query;
            let query = supabase.from('ads').select('*').eq('is_active', true);

            if (position) {
                query = query.eq('position', position);
            }

            const { data, error } = await query;
            if (error) throw error;

            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ADMIN: Get all ads
    adminGetAll: async (req, res) => {
        try {
            const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ADMIN: Create Ad
    create: async (req, res) => {
        try {
            const { position, title, image_url, link_url } = req.body;
            if (!position || !image_url) return res.status(400).json({ error: 'Position and Image URL required' });

            const { data, error } = await supabase.from('ads').insert([{
                position, title, image_url, link_url
            }]).select().single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ADMIN: Delete Ad
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const { error } = await supabase.from('ads').delete().eq('id', id);
            if (error) throw error;
            res.json({ success: true, message: 'Ad deleted' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ADMIN: Toggle Active
    toggle: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body; // true/false
            const { data, error } = await supabase.from('ads').update({ is_active: status }).eq('id', id).select().single();
            if (error) throw error;
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
};

module.exports = adsController;
