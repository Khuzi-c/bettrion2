const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.getPlatforms = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('casinos')
            .select('*')
            .eq('is_active', true)
            .order('rating', { ascending: false });

        console.log('Fetching Casinos:', data?.length || 0, 'found');
        if (error) console.error('Casino fetch error:', error);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getPlatformById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('casinos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getPlatformBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const { data, error } = await supabase
            .from('casinos')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.createPlatform = async (req, res) => {
    try {
        const { name, rating, logo, affiliate_link, description, short_description, pros, cons, visibility_countries, category, tags } = req.body;

        // Transform inputs
        const images = logo ? [logo] : [];
        const bonuses = { pros: pros || [], cons: cons || [] };

        // Generate slug
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        const { data, error } = await supabase
            .from('casinos')
            .insert([{
                name,
                slug,
                rating,
                affiliate_link,
                description,
                short_description,
                images,
                bonuses,
                category: category || 'Casino',
                tags: tags || [],
                visibility_countries: visibility_countries || ['global']
            }]);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- Articles ---

exports.getArticles = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        console.error('Get Articles Error:', err);
        // Return empty list if table missing to prevent frontend crash
        return res.json({ success: true, data: [] });
    }
};

exports.getArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.createArticle = async (req, res) => {
    try {
        const { title, slug, content, thumbnail, author, tags } = req.body;
        // Basic validation
        if (!title) return res.status(400).json({ success: false, error: 'Title is required' });

        const { data, error } = await supabase
            .from('articles')
            .insert([{
                title,
                slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                content,
                thumbnail,
                author,
                tags
            }]);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, content, thumbnail, author, tags, is_active } = req.body;

        const { data, error } = await supabase
            .from('articles')
            .update({
                title,
                slug,
                content,
                thumbnail,
                author,
                tags,
                is_active
            })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('articles')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Admin: Get all platforms (including inactive)
exports.getAllPlatformsAdmin = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('casinos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updatePlatform = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('casinos')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deletePlatform = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('casinos')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
