const supabase = require('../config/supabase');

const categoriesController = {
    getAll: async (req, res) => {
        const { type } = req.query;
        let query = supabase.from('categories').select('*');
        if (type) query = query.eq('type', type);

        const { data, error } = await query;
        if (error) return res.status(500).json({ message: error.message });
        res.json(data);
    },

    getOne: async (req, res) => {
        const { data, error } = await supabase.from('categories').select('*').eq('id', req.params.id).single();
        if (error) return res.status(404).json({ message: 'Category not found' });
        res.json(data);
    },

    create: async (req, res) => {
        const { data, error } = await supabase.from('categories').insert([req.body]).select().single();
        if (error) return res.status(500).json({ message: error.message });
        res.status(201).json(data);
    },

    update: async (req, res) => {
        const { data, error } = await supabase.from('categories').update(req.body).eq('id', req.params.id).select().single();
        if (error) return res.status(500).json({ message: error.message });
        res.json(data);
    },

    delete: async (req, res) => {
        const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
        if (error) return res.status(500).json({ message: error.message });
        res.json({ message: 'Deleted successfully' });
    }
};

module.exports = categoriesController;
