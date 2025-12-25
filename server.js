require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support Large HTML (Email templates)
app.use(express.static('frontend'));
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// User & Geo Middleware (Must be before routes)
const userMiddleware = require('./backend/middleware/userMiddleware');
app.use(userMiddleware);

// Visitor Logger (Logs IP/Country to Supabase)
const visitorLogger = require('./backend/middleware/visitorLogger');
app.use(visitorLogger);


// Create uploads directory if it serves static files from there (as per prompt)
app.use('/uploads', express.static(path.join(__dirname, 'backend/data/uploads')));
// Explicitly serve asset directories for easier access
app.use('/assets/flags', express.static(path.join(__dirname, 'frontend/country-flags-main/svg')));
app.use('/assets/img', express.static(path.join(__dirname, 'frontend/bettrion-img-assets')));
app.use('/assets/css', express.static(path.join(__dirname, 'frontend/assets/css'))); // Fix: Explicitly serve CSS

// --- Supabase Setup ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- Bot Setup ---
// Bot is initialized in backend/bot/bot.js which is loaded via routes/controllers
const { client } = require('./backend/bot/bot');

// --- Routes ---
const apiRouter = require('./backend/routes/api');
const authRoutes = require('./backend/routes/auth'); // Fix: Import Auth
const emailRoutes = require('./backend/routes/email'); // Fix: Import Email
const uploadRoutes = require('./backend/routes/uploads'); // Fix: Import Uploads
const userRoutes = require('./backend/routes/users'); // Fix: Import Users

// Mount Specific API Routes (Auth, Email, Uploads)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // Support /auth root for OAuth callbacks
app.use('/api/email', emailRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/users', userRoutes);

// Mount Generic API Router (Last)
app.use('/api', apiRouter);

// --- Maintenance Mode Middleware ---
app.use(async (req, res, next) => {
    // Skip maintenance check for admin pages and API
    if (req.path.startsWith('/admin') || req.path.startsWith('/api') || req.path.startsWith('/assets')) {
        return next();
    }

    try {
        const { data } = await supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', 'maintenance_mode')
            .single();

        if (data && data.setting_value === 'true') {
            return res.sendFile(path.join(__dirname, 'frontend/maintenance.html'));
        }
    } catch (err) {
        // If table doesn't exist or error, continue normally
        console.log('Maintenance check skipped:', err.message);
    }

    next();
});

// --- Social Media Redirects ---
app.get('/discord', (req, res) => res.redirect('https://discord.gg/bett'));
app.get('/instagram', (req, res) => res.redirect('https://www.instagram.com/bettrion/'));
app.get('/youtube', (req, res) => res.redirect('https://www.youtube.com/@Bettrion/'));
app.get('/khxzi', (req, res) => res.redirect('https://khxzi.shop/@bettrion/'));

// --- New Features (Clean URLs) ---
app.get('/casinos', (req, res) => res.sendFile(path.join(__dirname, 'frontend/casinos.html')));
app.get('/articles', (req, res) => res.sendFile(path.join(__dirname, 'frontend/articles.html')));
app.get('/slots', (req, res) => res.sendFile(path.join(__dirname, 'frontend/slots.html')));
app.get('/promotions', (req, res) => res.sendFile(path.join(__dirname, 'frontend/promotions.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'frontend/profile.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'frontend/settings.html')));
app.get('/support', (req, res) => res.sendFile(path.join(__dirname, 'frontend/support.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'frontend/login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'frontend/signup.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'frontend/about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'frontend/contact.html')));
app.get('/legal', (req, res) => res.sendFile(path.join(__dirname, 'frontend/legal.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'frontend/terms.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'frontend/privacy.html')));
app.get('/categories', (req, res) => res.sendFile(path.join(__dirname, 'frontend/categories.html')));
app.get('/verify', (req, res) => res.sendFile(path.join(__dirname, 'frontend/verify.html')));
app.get('/responsible-gambling', (req, res) => res.sendFile(path.join(__dirname, 'frontend/responsible-gambling.html')));

// --- Affiliate Routes (Clean URLs) ---
app.get('/affiliate', (req, res) => res.sendFile(path.join(__dirname, 'frontend/affiliate/index.html')));
app.get('/affiliate/payout', (req, res) => res.sendFile(path.join(__dirname, 'frontend/affiliate/payout.html')));
app.get('/affiliate/terms', (req, res) => res.sendFile(path.join(__dirname, 'frontend/affiliate/terms.html')));



// --- Language Prefix Routes (e.g. /es/casinos) ---
// MOVED ABOVE WILDCARD ROUTE
const supportedLangs = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ar', 'tr'];

// Helper to serve file for any lang prefix
const serveLangPage = (pageName) => (req, res) => {
    const filePath = path.join(__dirname, `frontend/${pageName}`);
    res.sendFile(filePath);
};

// Map all clean routes with :lang prefix
supportedLangs.forEach(lang => {
    app.get(`/${lang}`, (req, res) => res.sendFile(path.join(__dirname, 'frontend/index.html'))); // Home
    app.get(`/${lang}/casinos`, serveLangPage('casinos.html'));
    app.get(`/${lang}/slots`, serveLangPage('slots.html'));
    app.get(`/${lang}/articles`, serveLangPage('articles.html'));
    app.get(`/${lang}/promotions`, serveLangPage('promotions.html'));
    app.get(`/${lang}/profile`, serveLangPage('profile.html'));
    app.get(`/${lang}/support`, serveLangPage('support.html'));
    app.get(`/${lang}/about`, serveLangPage('about.html'));
    app.get(`/${lang}/contact`, serveLangPage('contact.html'));
    app.get(`/${lang}/legal`, serveLangPage('legal.html'));
    app.get(`/${lang}/terms`, serveLangPage('terms.html'));
    app.get(`/${lang}/privacy`, serveLangPage('privacy.html'));
    app.get(`/${lang}/responsible-gambling`, serveLangPage('responsible-gambling.html'));

    // SEO Routes Mapping
    app.get(`/${lang}/top-10-casinos`, (req, res) => res.sendFile(path.join(__dirname, 'frontend/index.html')));
    app.get(`/${lang}/top-3-casinos`, (req, res) => res.sendFile(path.join(__dirname, 'frontend/index.html')));
    app.get(`/${lang}/exclusives`, (req, res) => res.sendFile(path.join(__dirname, 'frontend/index.html')));
});

// Root SEO Routes
app.get('/top-10-casinos', (req, res) => res.sendFile(path.join(__dirname, 'frontend/index.html')));
app.get('/top-3-casinos', (req, res) => res.sendFile(path.join(__dirname, 'frontend/index.html')));
app.get('/exclusives', (req, res) => res.sendFile(path.join(__dirname, 'frontend/index.html')));

// --- SEO: Dynamic Sitemap ---
app.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = 'https://bettrion.com';
        const staticPages = [
            '', '/casinos', '/slots', '/promotions', '/articles',
            '/about', '/contact', '/login', '/signup',
            '/legal', '/terms', '/privacy', '/responsible-gambling'
        ];

        // 1. Fetch Dynamic Data
        const { data: casinos } = await supabase.from('casinos').select('slug, updated_at').eq('is_active', true);
        const { data: articles } = await supabase.from('articles').select('slug, updated_at').eq('is_published', true);

        // 2. Build XML
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Static Pages
        staticPages.forEach(page => {
            xml += `
    <url>
        <loc>${baseUrl}${page}</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`;
        });

        // Casinos
        if (casinos) {
            casinos.forEach(c => {
                xml += `
    <url>
        <loc>${baseUrl}/casinos/${c.slug}</loc>
        <lastmod>${c.updated_at ? new Date(c.updated_at).toISOString() : new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>`;
            });
        }

        // Articles
        if (articles) {
            articles.forEach(a => {
                xml += `
    <url>
        <loc>${baseUrl}/articles/${a.slug}</loc>
        <lastmod>${a.updated_at ? new Date(a.updated_at).toISOString() : new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`;
            });
        }

        xml += `
</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);

    } catch (err) {
        console.error('Sitemap Error:', err);
        res.status(500).send('Error generating sitemap');
    }
});

// Admin Handling
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'frontend/admin/login.html')));
app.get('/admin/:page', (req, res) => {
    const page = req.params.page;
    res.sendFile(path.join(__dirname, `frontend/admin/${page}.html`));
});

// Casino Dynamic Page (SEO Injected)
app.get('/casinos/:slug', async (req, res) => {
    const slug = req.params.slug;
    const filePath = path.join(__dirname, 'frontend/casino-page.html');

    try {
        // 1. Fetch Casino Data
        const { data: casino } = await supabase
            .from('casinos')
            .select('name, seo_title, seo_description, rating, logo_url, description, short_description')
            .eq('slug', slug)
            .single();

        if (!casino) {
            // Casino not found, serve file anyway (Client-side JS will handle 404 UI)
            return res.sendFile(filePath);
        }

        // 2. Read HTML Template
        const fs = require('fs');
        let html = fs.readFileSync(filePath, 'utf8');

        // 3. Construct Metadata (Fallback Logic)
        const currentYear = new Date().getFullYear();
        const title = casino.seo_title || `${casino.name} Review ${currentYear}: Bonuses & Games | Bettrion`;
        const description = casino.seo_description || `Read our honest ${casino.name} review. We cover RTP, withdrawal speeds, and exclusive ${casino.name} promo codes for ${currentYear}.`;

        // 4. Generate JSON-LD Schema (Review)
        const schema = {
            "@context": "https://schema.org",
            "@type": "Review",
            "itemReviewed": {
                "@type": "Organization",
                "name": casino.name,
                "image": casino.logo_url
            },
            "author": {
                "@type": "Organization",
                "name": "Bettrion"
            },
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": casino.rating || "5",
                "bestRating": "5",
                "worstRating": "1"
            },
            "datePublished": new Date().toISOString().split('T')[0],
            "description": description
        };

        // 5. Inject into HTML
        // Replace Title
        html = html.replace(/<title[^>]*>.*?<\/title>/, `<title>${title}</title>`);

        // Replace Description (Try to match existing meta tag)
        html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}">`);

        // Inject Schema before </head>
        const schemaScript = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
        html = html.replace('</head>', `${schemaScript}\n</head>`);

        // 6. Send Modified HTML
        res.send(html);

    } catch (err) {
        console.error('SEO Injection Error:', err);
        // Fallback to static file if anything breaks
        res.sendFile(filePath);
    }
});

// General Pages (Clean URLs) - Wildcard Last
app.get('/:page', (req, res) => {
    const page = req.params.page;

    // Ignore static assets that might fall through
    if (page.includes('.')) return res.status(404).send('Not Found');

    // Ignore lang prefixes if somehow matched (should be caught above, but safety check)
    if (supportedLangs.includes(page)) return res.sendFile(path.join(__dirname, 'frontend/index.html'));

    const filePath = path.join(__dirname, `frontend/${page}.html`);
    if (require('fs').existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        // Fallback to index or 404
        res.status(404).send('Page not found');
    }
});

// Fallback for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Public Domain: https://bettrion.com`);

    // Initialize auto-backup system
    initializeBackupScheduler();
});

// --- Auto-Backup Scheduler ---
function initializeBackupScheduler() {
    const { performBackup, cleanOldBackups } = require('./backend/services/backupService');

    // Run initial backup on startup (if no backup in last 6 hours)
    setTimeout(async () => {
        console.log('🔄 Checking for initial backup...');
        const { data } = await supabase
            .from('backups')
            .select('created_at')
            .eq('backup_type', 'auto')
            .order('created_at', { ascending: false })
            .limit(1);

        if (!data || data.length === 0) {
            console.log('📦 Creating initial backup...');
            await performBackup('auto');
        } else {
            const lastBackup = new Date(data[0].created_at);
            const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
            if (lastBackup < sixHoursAgo) {
                console.log('📦 Last backup is old, creating new one...');
                await performBackup('auto');
            }
        }
    }, 5000); // Wait 5 seconds after server start

    // Schedule auto-backup every 6 hours (21600000 ms)
    setInterval(async () => {
        console.log('📦 Running scheduled auto-backup...');
        await performBackup('auto');
    }, 6 * 60 * 60 * 1000);

    // Clean old backups daily
    setInterval(async () => {
        console.log('🧹 Running backup cleanup...');
        await cleanOldBackups();
    }, 24 * 60 * 60 * 1000);

    console.log('✅ Auto-backup scheduler initialized (6-hour interval)');
}

// Export for easier testing/importing if needed
module.exports = { app, supabase, client };
