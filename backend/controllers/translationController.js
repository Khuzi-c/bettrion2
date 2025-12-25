const translationService = require('../services/translationService');
const supabase = require('../config/supabase'); // Shared instance

/**
 * Handle dynamic frontend translations (POST /api/translate)
 * Body: { text: "Hello", target: "es" }
 */
exports.translateString = async (req, res) => {
    try {
        const { text, target } = req.body;
        if (!text || !target) return res.status(400).json({ success: false, error: 'Missing text or target' });

        // Handle Array of Strings (Batch)
        if (Array.isArray(text)) {
            const results = {};
            for (const str of text) {
                results[str] = await translationService.translateText(str, target, 'en', 'ui');
            }
            return res.json({ success: true, data: results });
        }

        // Single String
        const translated = await translationService.translateText(text, target, 'en', 'ui');
        res.json({ success: true, data: translated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Admin: Get Cache Stats
 */
exports.getCacheStats = async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('translations_cache')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Admin: Clear Cache
 */
exports.clearCache = async (req, res) => {
    try {
        const { error } = await supabase
            .from('translations_cache')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete All

        if (error) throw error;
        res.json({ success: true, message: 'Cache cleared' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
