const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const supabase = require('../config/supabase'); // Moved to top

// Middleware to check Admin Secret
const requireAdminSecret = (req, res, next) => {
    const secret = req.headers['x-admin-secret'];
    const envSecret = process.env.ADMIN_SECRET_KEY || process.env.ADMIN_PASSWORD; // Fallback to password if key missing

    if (secret !== envSecret) {
        return res.status(403).json({ message: 'Forbidden: Invalid Admin Secret' });
    }
    next();
};

// 1. Public Signup (POST /api/email/signup)
router.post('/signup', async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email) return res.status(400).json({ message: 'Email required' });

        const result = await emailService.subscribeUser(email, name);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Admin Send Manual Email (POST /api/email/admin/send)
router.post('/admin/send', requireAdminSecret, async (req, res) => {
    try {
        const { to, subject, html } = req.body;
        if (!to || !subject || !html) return res.status(400).json({ message: 'Missing fields' });

        const result = await emailService.sendEmail(to, subject, html);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Admin: Get all subscribers
router.get('/admin/subscribers', requireAdminSecret, async (req, res) => {
    try {
        const { data, error } = await supabase.from('subscribers').select('*').order('subscribed_at', { ascending: false });
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Admin: Broadcast Email
router.post('/admin/broadcast', requireAdminSecret, async (req, res) => {
    try {
        const { subject, html } = req.body;
        if (!subject || !html) return res.status(400).json({ message: 'Missing fields' });

        // Get all active subscribers
        const { data: subscribers } = await supabase
            .from('subscribers')
            .select('email')
            .eq('status', 'active');

        if (!subscribers || subscribers.length === 0) {
            return res.json({ success: true, message: 'No active subscribers found.' });
        }

        // Loop send (Simple approach, for production queue is better)
        let count = 0;
        for (const sub of subscribers) {
            try {
                await emailService.sendEmail(sub.email, subject, html);
                count++;
            } catch (e) {
                console.error(`Failed to send to ${sub.email}`, e);
            }
        }

        res.json({ success: true, count, message: `Sent to ${count} subscribers.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. Admin: Get Email History Logs
router.get('/admin/logs', requireAdminSecret, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sent_emails')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
