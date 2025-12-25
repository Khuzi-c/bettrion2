const supabase = require('../config/supabase'); // Use shared Service Role client

/**
 * Get admin statistics
 */
exports.getStats = async (req, res) => {
    try {
        const [casinos, users, tickets, active] = await Promise.all([
            supabase.from('casinos').select('id', { count: 'exact', head: true }),
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'OPEN'),
            supabase.from('active_sessions').select('id', { count: 'exact', head: true })
        ]);

        res.json({
            success: true,
            data: {
                casinos: casinos.count || 0,
                users: users.count || 0,
                tickets: tickets.count || 0,
                active: active.count || 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Get all users with IP/country tracking
 */
/**
 * Get all users with searching
 */
exports.getUsers = async (req, res) => {
    try {
        const { query } = req.query;
        let dbQuery = supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (query) {
            // Check if query is UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);

            if (isUUID) {
                dbQuery = dbQuery.eq('id', query);
            } else {
                // Search name, email, or exact discord_id match
                dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,discord_id.ilike.%${query}%`);
            }
        } else {
            // Default limit
            dbQuery = dbQuery.limit(50);
        }

        const { data, error } = await dbQuery;

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Get analytics data
 */
exports.getAnalytics = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        // Fetch from 'visitors' table (Automatic Logs) instead of 'analytics' (Manual Beacon)
        const { data, error } = await supabase
            .from('visitors')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        console.error('Analytics Error:', err);
        // Return empty data on ANY error to prevent Dashboard crash
        return res.json({ success: true, data: [] });
    }
};

/**
 * Track page visit
 */
exports.trackVisit = async (req, res) => {
    try {
        const { page_url, user_agent, referrer } = req.body;
        const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

        // Get country from IP (you can integrate with ipapi.co or similar)
        let country = 'Unknown';
        try {
            const ipRes = await fetch(`https://ipapi.co/${ip_address}/json/`);
            const ipData = await ipRes.json();
            country = ipData.country_name || 'Unknown';
        } catch (e) {
            // Silently fail if IP lookup fails
        }

        // Track in analytics
        await supabase.from('analytics').insert([{
            ip_address,
            country,
            page_url,
            user_agent,
            referrer
        }]);

        // Update active sessions
        await supabase.from('active_sessions').upsert([{
            ip_address,
            country,
            last_seen: new Date().toISOString()
        }], { onConflict: 'ip_address' });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Get Chart Data for Dashboard
 */
exports.getChartData = async (req, res) => {
    try {
        const today = new Date();
        const last7Days = new Array(7).fill(0).map((_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        // 1. User Growth (Last 7 Days)
        // Note: For large datasets, this should be an SQL grouping query. For now, fetching last ~200 users is fine for MVP.
        const { data: users } = await supabase
            .from('users')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(200);

        const userGrowth = last7Days.map(date => {
            return users ? users.filter(u => u.created_at.startsWith(date)).length : 0;
        });

        // 2. Browser Stats (from visitors)
        const { data: visitors } = await supabase
            .from('visitors')
            .select('user_agent, country_code')
            .limit(500)
            .order('created_at', { ascending: false });

        const browsers = {};
        const countries = {};

        if (visitors) {
            visitors.forEach(v => {
                let browser = 'Other';
                const ua = v.user_agent || '';
                if (ua.includes('Chrome')) browser = 'Chrome';
                else if (ua.includes('Firefox')) browser = 'Firefox';
                else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
                else if (ua.includes('Edge')) browser = 'Edge';

                browsers[browser] = (browsers[browser] || 0) + 1;

                const country = v.country_code || 'Unknown';
                countries[country] = (countries[country] || 0) + 1;
            });
        }

        res.json({
            success: true,
            data: {
                labels: last7Days,
                userGrowth,
                browsers,
                countries
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- DATABASE EDITOR ---

// --- DATABASE EDITOR (Enhanced) ---

exports.getTables = async (req, res) => {
    try {
        // Extended list including Supabase auth if possible, but sticking to public schema for safety
        const knownTables = ['users', 'casinos', 'shortlinks', 'tickets', 'ticket_messages', 'subscribers', 'sent_emails', 'visitors', 'active_sessions', 'backups', 'slots', 'site_settings', 'announcements', 'ads', 'notifications'];
        res.json({ success: true, data: knownTables });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.runQuery = async (req, res) => {
    try {
        const { queryType, table, id, data: updateData, sql } = req.body;

        // 1. SELECT (Table View)
        if (queryType === 'select') {
            const { data, error } = await supabase.from(table).select('*').limit(100).order('created_at', { ascending: false });
            if (error) throw error;
            return res.json({ success: true, data });
        }

        // 2. UPDATE (Row Edit)
        if (queryType === 'update') {
            if (!id) return res.status(400).json({ error: 'ID required for update' });
            const { data, error } = await supabase.from(table).update(updateData).eq('id', id).select();
            if (error) throw error;
            return res.json({ success: true, data });
        }

        // 3. DELETE (Row Delete)
        if (queryType === 'delete') {
            if (!id) return res.status(400).json({ error: 'ID required for delete' });
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            return res.json({ success: true });
        }

        // 4. DELETE ALL (Truncate simulation)
        if (queryType === 'truncate') {
            // Dangerous!
            const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all where ID is not imaginary UUID
            if (error) throw error;
            return res.json({ success: true, message: 'Table truncated' });
        }

        res.status(400).json({ success: false, error: 'Invalid query type' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- VISITOR MANAGEMENT ---

exports.deleteAllVisitors = async (req, res) => {
    try {
        // Delete all rows in 'visitors'. Safe delete requires a where clause.
        // As IDs are UUIDs, we check for not equal to Nil UUID
        const { error } = await supabase.from('visitors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        res.json({ success: true, message: 'All visitors cleared' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- USER MANAGEMENT (GOD MODE) ---

exports.updateUserBalance = async (req, res) => {
    try {
        const { id } = req.params;
        const { balance } = req.body;
        // Update balance
        const { data, error } = await supabase.from('users').update({ balance }).eq('id', id).select().single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ------------------- Admin User Management -------------------

/**
 * Get details of a specific user by ID
 */
exports.getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Ban a user (set banned flag)
 */
exports.banUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('users').update({ banned: true }).eq('id', id);
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Unban a user (clear banned flag)
 */
/**
 * Unban a user (clear banned flag)
 */
exports.unbanUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('users').update({ banned: false }).eq('id', id);
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Delete a user
 */
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Toggle User Verification Status
 */
exports.toggleUserVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // true or false
        const { data, error } = await supabase.from('users').update({ is_verified: status }).eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: `User verification set to ${status}` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Change a user's password
 */
exports.changeUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ success: false, error: 'newPassword required' });
        const bcrypt = require('bcryptjs');
        const hashed = await bcrypt.hash(newPassword, 10);
        const { data, error } = await supabase.from('users').update({ password: hashed }).eq('id', id);
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Send an email to a user (using emailService)
 */
/**
 * Generic Admin User Update (Edit Any Field)
 */
exports.updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // Expect JSON object with fields to update

        // Prevent ID modification
        delete updates.id;
        delete updates.user_id;

        const { data, error } = await supabase.from('users').update(updates).eq('id', id).select();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        console.error('Admin Update Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Send an email to a user (using emailService)
 */
exports.sendUserEmail = async (req, res) => {
    try {
        const { userId, subject, body, useFooter } = req.body;
        const targetId = userId || req.params.id;

        if (!subject || !body) return res.status(400).json({ success: false, error: 'subject and body required' });

        const { data: user, error: userErr } = await supabase.from('users').select('email').eq('id', targetId).single();
        if (userErr) throw userErr;

        const emailService = require('../services/emailService');
        const emailTemplates = require('../services/emailTemplates');

        let finalHtml = body;
        // Wrap in Corporate Template if requested
        if (useFooter || useFooter === 'true') {
            finalHtml = emailTemplates.baseTemplate(body);
        }

        await emailService.sendEmail(user.email, subject, finalHtml);
        res.json({ success: true, message: 'Email sent' });
    } catch (err) {
        console.error('Send Email Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Update Site Settings (Generic)
 */
exports.updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ success: false, error: 'Key required' });

        // Upsert setting
        const { data, error } = await supabase.from('site_settings')
            .upsert({ setting_key: key, setting_value: value, updated_at: new Date() }, { onConflict: 'setting_key' })
            .select().single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Update User Role (Promote/Demote)
 */
exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['user', 'admin', 'owner', 'support', 'moderator'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

        const { data, error } = await supabase.from('users').update({ role }).eq('id', id).select().single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- USER MANAGEMENT (GOD MODE) ---

exports.updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, avatar_url, password } = req.body;

        const updates = {};
        if (username) updates.username = username;
        if (email) updates.email = email;
        if (avatar_url) updates.avatar_url = avatar_url;

        if (password) {
            const bcrypt = require('bcryptjs');
            updates.password = await bcrypt.hash(password, 10);
        }

        const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- SECURITY & LOGS ---

exports.verifySudo = async (req, res) => {
    try {
        const { password } = req.body;
        const adminPass = process.env.ADMIN_PASSWORD;
        if (!adminPass) return res.status(500).json({ success: false, error: 'ADMIN_PASSWORD not set in env' });

        if (password === adminPass) {
            res.json({ success: true });
        } else {
            res.status(403).json({ success: false, error: 'Incorrect Password' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * FULL ADMIN UNLOCK 
 * Verifies Email (Identity) + Role + Global Admin Password
 */
exports.unlockAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Verify Global Password
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(403).json({ success: false, message: 'Invalid Admin Password Key' });
        }

        // 2. Verify User Role via Email
        const { data: user, error } = await supabase
            .from('users')
            .select('role')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(404).json({ success: false, message: 'User email not found' });
        }

        const allowedRoles = ['admin', 'owner', 'manager', 'support'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ success: false, message: 'User does not have admin privileges' });
        }

        // Success
        res.json({ success: true, role: user.role });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- LOGS ---
exports.getLogs = async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        // Try to find a log file. Prioritize combined.log
        const logFiles = ['combined.log', 'server.log', 'error.log'];
        let content = '';

        // Look in backend/logs/ or root logs/
        const logDirs = [
            path.join(__dirname, '../logs'),
            path.join(__dirname, '../../logs')
        ];

        let found = false;
        for (const dir of logDirs) {
            if (found) break;
            for (const file of logFiles) {
                const fullPath = path.join(dir, file);
                if (fs.existsSync(fullPath)) {
                    const stats = fs.statSync(fullPath);
                    // Read last 50KB to avoid crash
                    const size = stats.size;
                    const start = Math.max(0, size - 50000);
                    const stream = fs.createReadStream(fullPath, { start, encoding: 'utf8' });

                    // Simple promise wrapper for stream
                    const readStream = () => new Promise((resolve, reject) => {
                        let data = '';
                        stream.on('data', chunk => data += chunk);
                        stream.on('end', () => resolve(data));
                        stream.on('error', reject);
                    });

                    content = await readStream();
                    content = `--- Showing last 50KB of ${file} ---\n` + content;
                    found = true;
                    break;
                }
            }
        }

        if (!content) content = 'No log files found (checked logs/combined.log, server.log).';

        res.json({ success: true, data: content });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
// End of Controller
