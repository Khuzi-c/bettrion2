const supabase = require('../config/supabase');

const promotionsController = {
    // Public: Get Active Promotions
    getAll: async (req, res) => {
        try {
            // If admin, show all. If user, show only active.
            // Simplified: Public endpoint shows active. Admin endpoint shows all (handled in Admin API).
            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .eq('is_active', true)
                .order('start_date', { ascending: false });

            if (error) throw error;
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Admin: List All
    adminList: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Admin: Create
    create: async (req, res) => {
        try {
            const { title, description, image_url, bonus_code, link, start_date, end_date } = req.body;
            const { data, error } = await supabase
                .from('promotions')
                .insert({ title, description, image_url, bonus_code, link, start_date, end_date })
                .select().single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Admin: Update
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            const { data, error } = await supabase
                .from('promotions')
                .update(updates)
                .eq('id', id)
                .select().single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Admin: Delete
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const { error } = await supabase.from('promotions').delete().eq('id', id);
            if (error) throw error;
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = promotionsController;
