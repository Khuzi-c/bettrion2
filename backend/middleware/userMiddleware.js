const { createClient } = require('@supabase/supabase-js');
const geoService = require('../services/geoService');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async (req, res, next) => {
    // 1. Get/Create User ID
    let userId = req.headers['x-user-id'] || req.cookies?.user_id; // Check headers (from frontend) or cookies

    // Note: Since this is often an API backend, we rely on the frontend to send the UUID 
    // OR we generate it here and send it back.
    // For a strict implementation where "Every visitor is treated as a user",
    // we should look for a persistent identifier.

    // If request comes from browser fetch, it might not have the ID yet if it's the very first load.
    // The requirement says: "Generate a unique user_id (UUID) and store it in cookies or localStorage."
    // We'll generate one if missing and attach it to response headers so client can save it.

    let isNewUser = false;
    if (!userId) {
        userId = uuidv4();
        isNewUser = true;
        // Send back so client can save it
        res.setHeader('X-Set-User-ID', userId);
    }

    req.userId = userId;

    // 2. Get IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    // 3. Get Geo Data (Async - don't block if not critical, BUT logic says "On EVERY page load... Fetch FULL GEO")
    // For performance, we might want to await this only if we need strict country blocking *right now*.
    // Requirement 2: "Ban logic: If user.status === 'banned' -> Block"

    try {
        // Fetch User record to check status
        let { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (user) {
            // Update last seen (fire & forget)
            supabase.from('users').update({
                last_seen: new Date(),
                last_ip: ip
            }).eq('user_id', userId).then();
        } else {
            // Visitor is anonymous: do NOT create a user record.
            // We can proceed without `req.user` populated.
        }

        // 4. Attach to Request
        req.user = user;
        req.geo = await geoService.getGeoData(ip, req.headers['user-agent']); // Ensure we have latest GEO for current IP

        // 5. Enforce Ban
        if (user && user.status === 'banned') {
            return res.status(403).json({
                error: 'Access Restricted',
                message: 'Your account or region has been restricted from accessing this service.'
            });
        }

        // 6. Enforce Country Block (from Geo)
        // Fetch country rules
        if (req.geo && req.geo.country_code) {
            const { data: rule } = await supabase
                .from('country_rules')
                .select('status')
                .eq('country_code', req.geo.country_code)
                .single();

            if (rule && rule.status === 'blocked') {
                return res.status(403).json({
                    error: 'Region Blocked',
                    message: 'Service unavailable in your region.'
                });
            }
        }

    } catch (err) {
        console.error('User Middleware Error:', err);
        // Fallback: Allow request but log error
    }

    next();
};
