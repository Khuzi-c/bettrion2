const supabase = require('../config/supabase');

const notificationController = {
    // PUBLIC: Get active notifications
    getActive: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ADMIN: Get all
    getAll: async (req, res) => {
        try {
            const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ADMIN: Create
    create: async (req, res) => {
        try {
            const { title, message, type, link_text, link_url, color } = req.body;
            if (!title || !message) return res.status(400).json({ error: 'Title and message required' });

            const { data, error } = await supabase.from('notifications').insert([{
                title,
                message,
                type: type || 'info',
                link_text: link_text || null,
                link_url: link_url || null,
                color: color || '#3498db', // Default Blue
                is_active: true
            }]).select().single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ADMIN: Delete
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const { error } = await supabase.from('notifications').delete().eq('id', id);
            if (error) throw error;
            res.json({ success: true, message: 'Notification deleted' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // ADMIN: Toggle
    toggle: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const { data, error } = await supabase.from('notifications').update({ is_active: status }).eq('id', id).select().single();
            if (error) throw error;
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
};

module.exports = notificationController;
