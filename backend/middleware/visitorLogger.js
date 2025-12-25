
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Config
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const ANONYMIZE = (process.env.ANONYMIZE || 'true').toLowerCase() === 'true';
const SALT = process.env.SALT || 'bettrion_secret_salt';
const SKIP_EXTENSIONS = ['.css', '.js', '.png', '.jpg', '.webp', '.svg', '.ico', '.woff2', '.map', '.json'];

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Helpers
function getClientIp(req) {
    const xff = req.headers['x-forwarded-for'];
    if (xff) return xff.split(',')[0].trim();
    return req.ip || req.connection.remoteAddress;
}

function hashIp(ip) {
    return crypto.createHash('sha256').update(ip + SALT).digest('hex');
}

async function geoLookup(ip) {
    if (!ip || ip === '::1' || ip === '127.0.0.1') return {};
    const cleanIp = ip.includes('::ffff:') ? ip.split('::ffff:').pop() : ip;

    try {
        const res = await axios.get(`https://ipapi.co/${cleanIp}/json/`, { timeout: 2000 });
        const data = res.data;
        if (data.error) return {};

        return {
            country: data.country_name,
            country_code: data.country,
            city: data.city,
            region: data.region,
            latitude: data.latitude,
            longitude: data.longitude,
            asn: data.org
        };
    } catch (e) {
        return {};
    }
}

// Middleware
const visitorLogger = (req, res, next) => {
    // if (!req.cookies || req.cookies.consent !== 'true') return next(); // Forced logging for debugging

    if (!supabase) return next();
    if (SKIP_EXTENSIONS.some(ext => req.path.endsWith(ext))) return next();
    if (req.method === 'OPTIONS') return next();

    // Fire & Forget
    next();

    (async () => {
        try {
            const ip = getClientIp(req);
            const cleanIp = ip.includes('::ffff:') ? ip.split('::ffff:').pop() : ip;

            const ipHash = ANONYMIZE ? hashIp(cleanIp) : null;
            const storeIp = ANONYMIZE ? null : cleanIp;

            // Check if user is logged in (populated by userMiddleware)
            const userId = req.user ? req.user.id : null;

            const geo = await geoLookup(cleanIp);

            const logEntry = {
                user_id: userId, // Link to User if logged in
                ip: storeIp,
                ip_hash: ipHash,
                ip_anonymized: ANONYMIZE,
                path: req.originalUrl,
                method: req.method,
                user_agent: req.headers['user-agent'],
                referrer: req.headers['referer'] || req.headers['referrer'],
                country: geo.country || 'Unknown',
                region: geo.region,
                city: geo.city,
                asn: geo.asn
            };

            const { error } = await supabase.from('visitors').insert([logEntry]);
            if (error) {
                // console.error('Visitor Log Insert Error:', error.message);
            }
        } catch (err) {
            // console.error('Visitor Log Exception:', err.message);
        }
    })();
};

module.exports = visitorLogger;
