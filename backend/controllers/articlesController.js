const supabase = require('../config/supabase');

const articlesController = {
    getAll: async (req, res) => {
        const { data, error } = await supabase.from('articles').select('*');
        if (error) return res.status(500).json({ message: error.message });
        res.json(data);
    },

    getOne: async (req, res) => {
        const { data, error } = await supabase.from('articles').select('*').eq('id', req.params.id).single();
        if (error) return res.status(404).json({ message: 'Article not found' });
        res.json(data);
    },

    create: async (req, res) => {
        const { data, error } = await supabase.from('articles').insert([req.body]).select().single();
        if (error) return res.status(500).json({ message: error.message });
        res.status(201).json(data);
    },

    update: async (req, res) => {
        const { data, error } = await supabase.from('articles').update(req.body).eq('id', req.params.id).select().single();
        if (error) return res.status(500).json({ message: error.message });
        res.json(data);
    },

    delete: async (req, res) => {
        const { error } = await supabase.from('articles').delete().eq('id', req.params.id);
        if (error) return res.status(500).json({ message: error.message });
        res.json({ message: 'Deleted successfully' });
    }
};

module.exports = articlesController;
