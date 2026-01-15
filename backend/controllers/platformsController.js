const supabase = require('../config/supabase');

// MAPPING: V2 'Platforms' -> Supabase 'casinos' table

const platformsController = {
    getAll: async (req, res) => {
        const { country, lang } = req.query; // Added lang support

        let query = supabase.from('casinos').select('*')
            .order('ranking', { ascending: true }) // Ensure ranking is respected
            .order('created_at', { ascending: false });

        // Admin sees all, Public sees active
        if (!req.user || req.user.role !== 'admin') {
            query = query.eq('is_active', true);
        }

        // Country Filter
        if (country) {
            query = query.contains('visibility_countries', [country]);
        }

        const { data, error } = await query;

        if (error) return res.status(500).json({ message: error.message });

        let mapped = data.map(p => ({
            ...p,
            logo: p.logo || (p.images && p.images[0]) || '/assets/img/default-provider.png'
        }));

        // --- Auto-Translation Logic ---
        if (lang && lang !== 'en' && mapped.length > 0) {
            const translationService = require('../services/translationService');
            // Translate parallel for speed
            mapped = await Promise.all(mapped.map(async (p) => {
                // Fields to translate: description, short_description, features (array)
                let translated = await translationService.translateObject(p, ['description', 'short_description'], lang);

                // Translate Array Fields (Features) manually if needed or update service to handle arrays
                if (p.features && Array.isArray(p.features)) {
                    translated.features = await Promise.all(p.features.map(f => translationService.translateText(f, lang)));
                }
                // Translate Pros/Cons
                if (p.pros && Array.isArray(p.pros)) {
                    translated.pros = await Promise.all(p.pros.map(t => translationService.translateText(t, lang)));
                }
                if (p.cons && Array.isArray(p.cons)) {
                    translated.cons = await Promise.all(p.cons.map(t => translationService.translateText(t, lang)));
                }

                return translated;
            }));
        }

        res.json(mapped);
    },

    getOne: async (req, res) => {
        const { id } = req.params;
        const { lang } = req.query;

        // Check if valid UUID to determine if we search by ID or Slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        let query = supabase.from('casinos').select('*');
        if (isUUID) {
            query = query.eq('id', id);
        } else {
            query = query.eq('slug', id);
        }

        const { data, error } = await query.single();

        if (error || !data) return res.status(404).json({ message: 'Platform not found' });

        // GEO Check
        if (!req.user && req.query.country && data.visibility_countries) {
            if (!data.visibility_countries.includes(req.query.country) && !data.visibility_countries.includes('global')) {
                return res.status(403).json({ message: 'Restricted country' });
            }
        }

        let result = {
            ...data,
            logo: data.logo || (data.images && data.images[0])
        };

        // --- Auto-Translation Logic ---
        if (lang && lang !== 'en') {
            const translationService = require('../services/translationService');
            result = await translationService.translateObject(result, ['description', 'short_description'], lang);
            // Translate Features
            if (result.features && Array.isArray(result.features)) {
                result.features = await Promise.all(result.features.map(f => translationService.translateText(f, lang)));
            }
            if (result.pros && Array.isArray(result.pros)) {
                result.pros = await Promise.all(result.pros.map(t => translationService.translateText(t, lang)));
            }
            if (result.cons && Array.isArray(result.cons)) {
                result.cons = await Promise.all(result.cons.map(t => translationService.translateText(t, lang)));
            }
        }

        res.json(result);
    },

    create: async (req, res) => {
        // Map V2 body to Table columns
        const { name, slug, rating, ranking, is_exclusive, short_description, long_description, logo, banner, countries_visible, payment_methods, features, pros, cons, review_article_id, category, tags, affiliate_link } = req.body;

        const payload = {
            name,
            slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            rating,
            ranking: ranking || 999,
            is_exclusive: is_exclusive || false,
            short_description,
            description: long_description || short_description,
            logo, banner,
            affiliate_link,
            category: category || 'Casino',
            tags: tags || [],
            features: features || [],
            pros: pros || [],
            cons: cons || [],
            review_article_id: (review_article_id && review_article_id !== '') ? review_article_id : null,
            payment_methods: payment_methods || [],
            visibility_countries: countries_visible ? (Array.isArray(countries_visible) ? countries_visible : countries_visible.split(',')) : ['global'],
            created_at: new Date(),
            is_active: true
        };

        const { data, error } = await supabase.from('casinos').insert([payload]).select().single();
        if (error) return res.status(500).json({ message: error.message });

        // --- NEWS FEED (Wave 3) ---
        if (req.body.postToDiscord) {
            (async () => {
                try {
                    const { client: botClient } = require('../bot/bot');
                    if (botClient) {
                        botClient.postNews(data);
                    }
                } catch (e) { console.error("News Feed Error:", e); }
            })();
        }


        res.status(201).json(data);
    },

    update: async (req, res) => {
        const { id } = req.params;
        const { name, slug, rating, ranking, is_exclusive, short_description, long_description, logo, banner, countries_visible, payment_methods, features, pros, cons, review_article_id, category, tags, affiliate_link, description } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (slug) updates.slug = slug;
        if (rating) updates.rating = rating;
        if (ranking) updates.ranking = ranking;
        if (typeof is_exclusive !== 'undefined') updates.is_exclusive = is_exclusive;
        if (short_description) updates.short_description = short_description;
        if (long_description) updates.description = long_description;
        if (description) updates.description = description; // Handle both
        if (logo) updates.logo = logo;
        if (banner) updates.banner = banner;
        if (affiliate_link) updates.affiliate_link = affiliate_link;
        if (category) updates.category = category;
        if (tags) updates.tags = tags;
        if (features) updates.features = features;
        if (pros) updates.pros = pros;
        if (cons) updates.cons = cons;
        if (payment_methods) updates.payment_methods = payment_methods;

        if (typeof review_article_id !== 'undefined') {
            updates.review_article_id = (review_article_id && review_article_id !== '') ? review_article_id : null;
        }

        if (countries_visible) {
            updates.visibility_countries = (Array.isArray(countries_visible) ? countries_visible : countries_visible.split(','));
        }

        if (req.body.custom_html_content) {
            try {
                const fs = require('fs');
                const path = require('path');
                // Use slug from Update or existing data? Ideally slug is passed in body, if not we might need to fetch it.
                // Assuming slug is updating or we use the sent slug. 
                // Caution: If slug changes, we should rename file, but for now let's just write to the current slug.
                const targetSlug = slug || (req.body.slug);

                if (targetSlug) {
                    const filePath = path.join(__dirname, '../../frontend/custom-casinos', `${targetSlug}.html`);
                    const dir = path.dirname(filePath);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                    fs.writeFileSync(filePath, req.body.custom_html_content, 'utf8');
                }
            } catch (err) { console.error('Write Error:', err); }
        }

        const { data, error } = await supabase.from('casinos').update(updates).eq('id', id).select().single();

        if (error) return res.status(500).json({ message: error.message });
        res.json(data);
    },

    getPlatforms: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('casinos')
                .select('*')
                .order('ranking', { ascending: true }) // Respect Admin Ranking
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    delete: async (req, res) => {
        const { error } = await supabase.from('casinos').delete().eq('id', req.params.id);
        if (error) return res.status(500).json({ message: error.message });
        res.json({ success: true });
    },

    getTopLists: async (req, res) => {
        const { lang } = req.query;
        try {
            // 1. Get Settings
            const { data: setting } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'top_lists').single();
            const defaultConfig = { top3: [], top10: [] };
            let config = defaultConfig;

            if (setting && setting.setting_value) {
                try {
                    config = JSON.parse(setting.setting_value);
                    if (typeof config === 'string') config = JSON.parse(config); // Handle double stringify
                } catch (e) { }
            }

            // 2. Fetch Casinos
            const allIds = [...new Set([...(config.top3 || []), ...(config.top10 || [])])];
            let casinos = [];

            // Fetch specific IDs if configured
            if (allIds.length > 0) {
                const { data, error } = await supabase.from('casinos').select('*').in('id', allIds).eq('is_active', true);
                if (!error) casinos = data;
            }

            // FALLBACK: If specific lists are empty or not found, fetch standard top ranked (Ranking 1-10)
            if (casinos.length === 0) {
                const { data: fallback, error: fbError } = await supabase
                    .from('casinos')
                    .select('*')
                    .eq('is_active', true)
                    .order('ranking', { ascending: true })
                    .limit(10);

                if (!fbError && fallback.length > 0) {
                    casinos = fallback;

                    // Auto-fill config locally for mapping
                    if ((!config.top3 || config.top3.length === 0) && fallback.length >= 1) {
                        config.top3 = fallback.slice(0, 3).map(c => c.id);
                    }
                    if ((!config.top10 || config.top10.length === 0) && fallback.length >= 1) {
                        config.top10 = fallback.slice(0, 10).map(c => c.id);
                    }
                }
            }

            // Fallback logic could go here if requested, but precise control is requested.

            // Map by ID helper
            const casinoMap = {};
            casinos.forEach(c => {
                c.logo = c.logo || (c.images && c.images[0]) || '/assets/img/default-provider.png';
                casinoMap[c.id] = c;
            });

            const mapList = (ids) => {
                if (!ids) return [];
                return ids.map(id => casinoMap[id]).filter(c => c);
            };

            let top3 = mapList(config.top3);
            let top10 = mapList(config.top10);

            // --- Translation Logic ---
            if (lang && lang !== 'en') {
                const translationService = require('../services/translationService');
                const translateList = async (list) => {
                    return await Promise.all(list.map(async (p) => {
                        let translated = await translationService.translateObject(p, ['description', 'short_description'], lang);
                        if (p.features && Array.isArray(p.features)) {
                            translated.features = await Promise.all(p.features.map(f => translationService.translateText(f, lang)));
                        }
                        return translated;
                    }));
                };

                top3 = await translateList(top3);
                top10 = await translateList(top10);
            }

            res.json({ top3, top10 });

        } catch (err) {
            console.error('getTopLists Error:', err);
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = platformsController;

