const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Get active announcements
exports.getActiveAnnouncements = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;
        res.json({ success: true, data: data[0] || null });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get all announcements (admin)
exports.getAllAnnouncements = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Create announcement
exports.createAnnouncement = async (req, res) => {
    try {
        const { message, background_color, text_color, created_by } = req.body;

        const { data, error } = await supabase
            .from('announcements')
            .insert([{
                message,
                background_color: background_color || '#dc2626',
                text_color: text_color || '#ffffff',
                created_by: created_by || 'Admin'
            }])
            .select();

        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Update announcement
exports.updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('announcements')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Announcement deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Toggle announcement active status
exports.toggleAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const { data, error } = await supabase
            .from('announcements')
            .update({ is_active, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
