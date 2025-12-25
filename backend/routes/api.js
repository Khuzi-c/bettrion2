const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const supabase = require('../config/supabase');
const platformsController = require('../controllers/platformsController'); // NEW
const ticketController = require('../controllers/ticketController');
const adminController = require('../controllers/adminController');
console.log('adminController keys:', Object.keys(adminController));
const promotionsController = require('../controllers/promotionsController'); // New
const userController = require('../controllers/userController'); // NEW Identity Controller

const ticketSyncController = require('../controllers/ticketSyncController');
const affiliateController = require('../controllers/affiliateController'); // Import Affiliate Controller
const authMiddleware = require('../middleware/authMiddleware'); // Moved to top
router.get('/promotions', promotionsController.getAll); // Public

// --- Identity Linking Routes ---
router.post('/user/discord/link', authMiddleware.verifyToken, userController.requestDiscordLink);
router.post('/user/discord/verify', authMiddleware.verifyToken, userController.verifyDiscordLink);

// --- Admin Promotions ---
router.get('/admin/promotions', promotionsController.adminList);
router.post('/admin/promotions', promotionsController.create);
router.put('/admin/promotions/:id', promotionsController.update);
router.delete('/admin/promotions/:id', promotionsController.delete);

// --- Admin User Management V2 ---
router.get('/admin/users/:id', adminController.getUserDetails);
router.post('/admin/users/:id/ban', adminController.banUser);
router.post('/admin/users/:id/unban', adminController.unbanUser);
router.post('/admin/users/:id/password', adminController.changeUserPassword);
router.post('/admin/users/:id/email', adminController.sendUserEmail);
router.post('/admin/users/:id/verify', adminController.toggleUserVerification);
router.put('/admin/users/:id/profile', adminController.updateUserProfile); // NEW: Full Edit
router.delete('/admin/users/:id', adminController.deleteUser); // NEW

// Public Platforms
router.get('/platforms', platformsController.getAll); // Switched to new controller
router.get('/platforms/top-lists', platformsController.getTopLists); // NEW: Custom Top Lists


router.get('/platforms/:id', platformsController.getOne);
router.get('/platforms/slug/:slug', contentController.getPlatformBySlug); // Keep if platformsController doesn't have slug yet, or update

// Admin Platforms
router.post('/platforms', platformsController.create); // Should be admin too?
router.post('/admin/platforms', platformsController.create); // Dual alias or fix frontend
router.get('/admin/platforms', platformsController.getAll);
router.put('/admin/platforms/:id', platformsController.update);
router.delete('/admin/platforms/:id', platformsController.delete);
router.put('/platforms/:id', platformsController.update); // Keep alias for safety if other files use it
router.delete('/platforms/:id', platformsController.delete); // Keep alias

// Admin Articles
router.get('/articles', contentController.getArticles);
router.get('/articles/:id', contentController.getArticleById);
router.post('/articles', contentController.createArticle);
router.put('/articles/:id', contentController.updateArticle); // NEW
router.delete('/articles/:id', contentController.deleteArticle);

// Tickets
router.post('/tickets/create', ticketController.createTicket);
router.get('/tickets', ticketController.getAllTickets);
router.get('/tickets/:id/messages', ticketController.getTicketMessages);
router.post('/tickets/close', ticketController.closeTicket);
router.post('/messages', ticketController.sendMessage);
router.put('/tickets/:id/status', ticketController.updateTicketStatus);
router.delete('/tickets/:id', ticketController.deleteTicket);

// Admin
router.get('/admin/stats', authMiddleware.verifyToken, authMiddleware.isAdmin, adminController.getStats);
router.get('/admin/users', authMiddleware.verifyToken, authMiddleware.isAdmin, adminController.getUsers);
router.get('/admin/analytics', authMiddleware.verifyToken, authMiddleware.isAdmin, adminController.getAnalytics);
router.post('/admin/track', adminController.trackVisit);
router.delete('/admin/visitors', adminController.deleteAllVisitors); // NEW: Clear history
const adsController = require('../controllers/adsController'); // NEW

// --- Ads Routes ---
router.get('/ads', adsController.getAds); // Public
router.get('/admin/ads', adsController.adminGetAll);
router.post('/admin/ads', adsController.create);
router.delete('/admin/ads/:id', adsController.delete);
router.put('/admin/ads/:id/toggle', adsController.toggle);

// --- Admin Database ---
router.get('/admin/db/tables', adminController.getTables);
router.post('/admin/db/query', adminController.runQuery);
router.get('/admin/charts', adminController.getChartData); // NEW
router.post('/admin/settings', adminController.updateSetting);

// --- User Management (Roles) ---
router.put('/admin/users/:id/role', adminController.updateRole);
router.put('/admin/users/:id/balance', adminController.updateUserBalance);
router.post('/admin/users/email', adminController.sendUserEmail);
// --- Security & Logs ---
router.post('/admin/verify-sudo', adminController.verifySudo);
router.post('/admin/unlock', adminController.unlockAdmin); // NEW LOCK
router.get('/admin/logs', adminController.getLogs);

const notificationController = require('../controllers/notificationController'); // NEW
// --- Notifications Routes ---
router.get('/notifications', notificationController.getActive); // Public
router.get('/admin/notifications', notificationController.getAll);
router.post('/admin/notifications', notificationController.create);
router.delete('/admin/notifications/:id', notificationController.delete);
router.put('/admin/notifications/:id/toggle', notificationController.toggle);

// --- Consent & Language Routes ---
router.post('/consent', async (req, res) => {
    try {
        const { consent } = req.body;
        if (!consent) return res.status(400).json({ success: false, error: 'Consent required' });
        // Set cookie (client will also set localStorage)
        res.cookie('consent', 'true', { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'Lax' });
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
        const fetch = require('node-fetch');
        const ipRes = await fetch(`https://ipapi.co/${ip}/json/`);
        const ipData = await ipRes.json();
        const visitor = {
            ip,
            city: ipData.city,
            region: ipData.region,
            country: ipData.country_name,
            country_code: ipData.country_code,
            currency: ipData.currency,
            languages: ipData.languages,
            timezone: ipData.timezone,
            org: ipData.org,
            latitude: ipData.latitude,
            longitude: ipData.longitude,
            user_agent: req.headers['user-agent'] || '',
            created_at: new Date().toISOString(),
            consent_given: true,
            consent_timestamp: new Date().toISOString()
        };
        await supabase.from('visitors').insert([visitor]);
        res.json({ success: true });
    } catch (err) {
        console.error('Consent error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/translations/:lang', async (req, res) => {
    try {
        const lang = req.params.lang;
        const path = require('path');
        const fs = require('fs');
        const filePath = path.join(__dirname, '../../frontend/assets/i18n', `${lang}.json`);

        // Use static file if exists, otherwise return empty (will trigger dynamic translation fallback in frontend)
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return res.json({ success: true, data });
        }

        // If no static file, return empty data so frontend uses dynamic API
        res.json({ success: true, data: {} });
    } catch (err) {
        console.error('Translations error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Dynamic Auto-Translation Routes ---
const translationController = require('../controllers/translationController');
router.post('/ui/translate', translationController.translateString);
router.get('/admin/translations/stats', translationController.getCacheStats);
router.post('/admin/translations/clear', translationController.clearCache);

// Staff
const staffController = require('../controllers/staffController');
router.post('/staff/clock-in', staffController.clockIn);
router.post('/staff/clock-out', staffController.clockOut);
router.get('/staff/status/:user_id', staffController.getStaffStatus);
router.get('/admin/staff-logs', staffController.getAllLogs);

// Backups
const backupController = require('../controllers/backupController');
router.post('/backups/create', backupController.createBackup);
router.get('/backups', backupController.getAllBackups);
router.get('/backups/:id', backupController.getBackupById);
router.post('/backups/:id/restore', backupController.restoreFromBackup);
router.delete('/backups/:id', backupController.deleteBackup);

// Activity Logs & Analytics
const activityLogController = require('../controllers/activityLogController');
router.get('/activity-logs', activityLogController.getActivityLogs);
router.post('/track-button', activityLogController.trackButtonClick);
router.get('/button-stats', activityLogController.getButtonStats);

// Uploads
const uploadController = require('../controllers/uploadController');
router.post('/uploads', uploadController.uploadMiddleware, uploadController.handleUpload);
router.get('/uploads/list', uploadController.getAllImages);
router.delete('/uploads/:id', uploadController.deleteImage);

// Announcements
const announcementController = require('../controllers/announcementController');
router.get('/announcements/active', announcementController.getActiveAnnouncements);
router.get('/admin/announcements', announcementController.getAllAnnouncements);
router.post('/admin/announcements', announcementController.createAnnouncement);
router.put('/admin/announcements/:id', announcementController.updateAnnouncement);
router.delete('/admin/announcements/:id', announcementController.deleteAnnouncement);
router.patch('/admin/announcements/:id/toggle', announcementController.toggleAnnouncement);

// News RSS Feed
const newsController = require('../controllers/newsController');
router.get('/news/rss', newsController.getNewsFromRSS);
router.post('/admin/news/refresh', newsController.refreshNewsCache);

// Settings
const settingsController = require('../controllers/settingsController');
router.get('/settings/:key', settingsController.getSetting);
router.get('/admin/settings/all', settingsController.getAllSettings);
router.put('/admin/settings/:key', settingsController.updateSetting);
router.post('/admin/settings/maintenance/toggle', settingsController.toggleMaintenanceMode);

// Auth routes are now handled in routes/auth.js mounted at /api/auth

// --- User Profile Management (Authenticated) ---
// --- User Profile Management (Authenticated) ---



router.get('/users/me', authMiddleware.verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/users/me/avatar', authMiddleware.verifyToken, userController.updateProfile);
router.post('/users/me/username', authMiddleware.verifyToken, userController.updateUsername); // NEW
router.put('/users/me/settings', authMiddleware.verifyToken, userController.updateSettings);
router.get('/users/me/preferences', authMiddleware.verifyToken, userController.getPreferences);
router.put('/users/me/preferences', authMiddleware.verifyToken, userController.updatePreferences);

// --- Admin User Management ---
router.put('/admin/users/:id/balance', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.updateBalance);
router.put('/admin/users/:id/role', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.updateRole);
router.post('/admin/users/:id/verify', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.toggleVerify);
router.post('/admin/users/:id/ban', authMiddleware.verifyToken, authMiddleware.isAdmin, (req, res) => { req.body.action = 'ban'; userController.toggleBan(req, res) });
router.post('/admin/users/:id/unban', authMiddleware.verifyToken, authMiddleware.isAdmin, (req, res) => { req.body.action = 'unban'; userController.toggleBan(req, res) });
router.delete('/admin/users/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.deleteUser);
router.post('/admin/users/:id/password', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.adminUpdatePassword);
router.put('/admin/users/:id/profile', authMiddleware.verifyToken, authMiddleware.isAdmin, userController.adminUpdateProfile);

// --- Affiliate Routes ---

router.get('/affiliate/stats', authMiddleware.verifyToken, affiliateController.getMyStats);
router.post('/affiliate/payout', authMiddleware.verifyToken, affiliateController.requestPayout);
router.post('/affiliate/code', authMiddleware.verifyToken, affiliateController.updateReferralCode);
router.get('/affiliate/payouts', authMiddleware.verifyToken, affiliateController.getPayoutHistory);

// Admin Affiliate Routes
router.get('/admin/affiliates/payouts', authMiddleware.verifyToken, authMiddleware.isAdmin, affiliateController.getAdminPayouts);
router.post('/admin/affiliates/process', authMiddleware.verifyToken, authMiddleware.isAdmin, affiliateController.processPayout);

// --- Bot Routes ---
const { client: botClient } = require('../bot/bot');

// Helper
const botCheck = (res) => {
    if (!botClient) {
        res.status(503).json({ success: false, message: 'Bot Not Initialized' });
        return false;
    }
    return true;
};

// Announcement
router.post('/admin/bot/announce', authMiddleware.verifyToken, authMiddleware.isAdmin, async (req, res) => {
    if (!botCheck(res)) return;

    // Support advanced embed fields
    const { channelId, title, content, color, image, url, footer, plainText } = req.body;

    const embedData = {
        title,
        description: content,
        color,
        image,
        url,
        footer,
        plainText
    };

    const result = await botClient.sendAnnouncement(channelId, embedData);
    if (result.success) return res.json({ success: true });
    return res.status(400).json(result);
});

// Stats
router.get('/admin/bot/guild/:id/stats', authMiddleware.verifyToken, authMiddleware.isAdmin, async (req, res) => {
    if (!botCheck(res)) return;
    const result = await botClient.getGuildStats(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
});

// Logs (AutoMod)
router.get('/admin/bot/guild/:id/logs', authMiddleware.verifyToken, authMiddleware.isAdmin, async (req, res) => {
    if (!botCheck(res)) return;
    const result = await botClient.fetchAuditLogs(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
});

// Member Info
router.get('/admin/bot/guild/:guildId/member/:userId', authMiddleware.verifyToken, authMiddleware.isAdmin, async (req, res) => {
    if (!botCheck(res)) return;
    const result = await botClient.getMemberDetails(req.params.guildId, req.params.userId);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
});

// Actions (Kick/Ban/DM)
router.post('/admin/bot/action', authMiddleware.verifyToken, authMiddleware.isAdmin, async (req, res) => {
    if (!botCheck(res)) return;
    const { action, guildId, userId, reason, content } = req.body;

    let result = { success: false, message: 'Invalid Action' };

    if (action === 'kick') result = await botClient.kickMember(guildId, userId, reason);
    else if (action === 'ban') result = await botClient.banMember(guildId, userId, reason);
    else if (action === 'dm') result = await botClient.sendDM(userId, content);

    if (result.success) return res.json(result);
    return res.status(400).json(result);
});

// --- Management Routes (Channels/Roles/History) ---
router.get('/admin/bot/guild/:id/channels', authMiddleware.verifyToken, authMiddleware.isAdmin, async (req, res) => {
    if (!botCheck(res)) return;
    const result = await botClient.getChannels(req.params.id);
    res.json(result);
});

router.get('/admin/bot/guild/:id/roles', authMiddleware.verifyToken, authMiddleware.isAdmin, async (req, res) => {
    if (!botCheck(res)) return;
    const result = await botClient.getRoles(req.params.id);
    res.json(result);
});

router.get('/admin/bot/channel/:id/history', authMiddleware.verifyToken, authMiddleware.isAdmin, async (req, res) => {
    if (!botCheck(res)) return;
    const result = await botClient.getHistory(req.params.id);
    res.json(result);
});

router.post('/admin/bot/manage', authMiddleware.verifyToken, authMiddleware.isAdmin, async (req, res) => {
    if (!botCheck(res)) return;
    const { type, action, guildId, data } = req.body;
    let result = { success: false, error: 'Invalid Type' };

    // Stub response for manage route
    res.json(result);
});

// Fraud Intel Lookup
router.post('/admin/bot/lookup', authMiddleware.verifyToken, authMiddleware.isAdmin, async (req, res) => {
    if (!botCheck(res)) return;
    const { query, guildId } = req.body;

    try {
        // 1. Web Search (Email or Name)
        let webUser = null;
        if (query.includes('@')) {
            const { data } = await supabase.from('users').select('*').eq('email', query).maybeSingle();
            webUser = data;
        } else {
            const { data } = await supabase.from('users').select('*').ilike('name', `%${query}%`).maybeSingle();
            webUser = data;
        }

        // 2. Discord Search
        const disResult = await botClient.getMemberDetails(guildId, query);
        const disUser = disResult.success ? disResult.data : null;

        // 3. Analysis
        const analysis = { riskScore: 0, flags: [] };

        if (!webUser && !disUser) return res.json({ success: false, message: 'User not found on Web or Discord' });

        if (webUser && disUser) {
            analysis.match = true;
            // Check Account Age (Fraud Check)
            const webDate = new Date(webUser.created_at);
            const disDate = new Date(disUser.createdAt);
            const diffDays = Math.abs(webDate - disDate) / (1000 * 60 * 60 * 24);

            if (disDate > new Date(Date.now() - 86400000 * 2)) {
                analysis.flags.push('Discord Account < 2 Days Old');
                analysis.riskScore += 50;
            }
        } else {
            analysis.match = false;
            if (!webUser) analysis.flags.push('Discord Only (Unlinked)');
            if (!disUser) analysis.flags.push('Web Only (Not in Server)');
        }

        res.json({ success: true, web: webUser, discord: disUser, analysis });

    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Ban All
router.post('/admin/bot/ban-all', authMiddleware.verifyToken, authMiddleware.isAdmin, async (req, res) => {
    if (!botCheck(res)) return;
    const { webId, discordId, guildId, reason } = req.body;

    const results = { web: false, discord: false };

    // Ban Web
    if (webId) {
        // Call adminController logic or direct DB update
        await supabase.from('users').update({ status: 'banned', ban_reason: reason }).eq('id', webId);
        results.web = true;
    }

    // Ban Discord
    if (discordId) {
        await botClient.banMember(guildId, discordId, reason);
        results.discord = true;
    }

    res.json({ success: true, results });
});


module.exports = router;
