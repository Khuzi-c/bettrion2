const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Logger = require('./utils/logger'); // Import Logger

// Routes imports
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/uploads');
const userRoutes = require('./routes/users');
const emailRoutes = require('./routes/email');

const app = express();

// Initialize Logger
Logger.init();

// Middleware
app.use(require('helmet')({
    contentSecurityPolicy: false, // Allow external resources (Google Fonts, CDNs)
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// DEBUG LOGGER & VISITOR LOGGER
const visitorLogger = require('./middleware/visitorLogger');
app.use((req, res, next) => {
    // console.log(`[REQUEST] ${req.method} ${req.path}`); // Too verbose for main log
    next();
});
app.use(visitorLogger);
const passport = require('./config/passport');
app.use(passport.initialize());

// --- ROUTES ---

// 1. Logs Endpoint (Protected by Admin Auth theoretically, but open for now)
app.get('/api/admin/logs', (req, res) => {
    res.json({ success: true, logs: Logger.getLogs() });
});

// 2. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/email', emailRoutes);
app.use('/api', apiRoutes);

// 3. Admin Routes & Static Files
// Serve everything in /admin from ../admin/
// 3. Admin Routes (Prioritized)
// 3. Admin Routes (Simple Static Hosting)
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin'), { extensions: ['html'] }));

// 4. Shared Assets
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

// 5a. Casino Slug Route
// Casino Detail Route (DB-Driven Custom Pages)
// Casino Detail Route (DB-Driven Custom Pages)
app.get('/casinos/:slug', async (req, res) => {
    const slug = req.params.slug;

    // 1. Try to Fetch from DB to check for Custom HTML
    try {
        const supabase = require('./config/supabase');
        const { data } = await supabase.from('casinos').select('description, tags').eq('slug', slug).single();

        // 2. If it's a "Custom HTML" page, serve the content directly
        if (data && data.tags && data.tags.includes('custom-html')) {
            return res.send(data.description);
        }
    } catch (e) {
        console.error('Slug Lookup Error', e);
    }

    // 3. Fallback to Dynamic Template (Standard System)
    res.sendFile(path.join(__dirname, '../frontend/platform-detail.html'));
});

// 5. Frontend Routes (Last Priority)
// Serve everything else from ../frontend/
app.use(express.static(path.join(__dirname, '../frontend'), { extensions: ['html'] }));

// 6. SPA Fallback / 404
// If nothing matched, send 404 (or index.html if we were doing SPA, but we are doing separate files)
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'), (err) => {
        if (err) res.status(404).json({ message: 'Page Not Found' });
    });
});

module.exports = app;
