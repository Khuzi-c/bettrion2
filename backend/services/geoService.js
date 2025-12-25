const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Cache in memory for short term, but primarily rely on database if needed.
// For now, simple in-memory cache to avoid hitting rate limits too hard during dev.
const memoryCache = new Map();

const geoip = require('geoip-lite');

exports.getGeoData = async (ip, userAgent) => {
    // Skip local/private IPs and return localhost dummy data
    if (isPrivateIP(ip)) {
        return {
            ip: ip,
            country_code: 'LO',
            country_name: 'Localhost',
            city: 'Local',
            languages: 'en'
        };
    }

    // Check cache
    if (memoryCache.has(ip)) {
        return memoryCache.get(ip);
    }

    try {
        // Fetch from ipapi.co - DISABLED to prevent 403 errors, using geoip-lite only.
        // const response = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 3000 });
        throw new Error('Using local geoip-lite');

        /*
        if (response.data.error) {
            throw new Error(response.data.reason || 'API Error');
        }

        const geoData = response.data;
        memoryCache.set(ip, geoData);

        // Log asynchronously to not block
        logIp(geoData, userAgent).catch(err => console.error('Log Error:', err.message));

        return geoData;
        */
    } catch (error) {
        console.warn(`Geo Service API Warning: ${error.message}. Falling back to geoip-lite.`);

        // Fallback to geoip-lite
        const geo = geoip.lookup(ip);
        if (geo) {
            const fallbackData = {
                ip: ip,
                country_code: geo.country,
                country_name: geo.country, // geoip-lite doesn't give full name easily without extra lookup
                city: geo.city,
                region: geo.region,
                timezone: geo.timezone,
                latitude: geo.ll[0],
                longitude: geo.ll[1],
                languages: 'en' // Default
            };
            memoryCache.set(ip, fallbackData);
            return fallbackData;
        }

        return { ip: ip, country_code: 'XX', country_name: 'Unknown', city: 'Unknown' };
    }
};

async function logIp(geoData, userAgent) {
    try {
        await supabase.from('ip_logs').insert({
            ip: geoData.ip,
            country_code: geoData.country_code,
            country_name: geoData.country_name,
            city: geoData.city,
            region: geoData.region,
            timezone: geoData.timezone,
            currency: geoData.currency,
            isp: geoData.org, // ipapi returns org/asn often in 'org'
            asn: geoData.asn,
            latitude: geoData.latitude,
            longitude: geoData.longitude,
            user_agent: userAgent || 'Unknown'
        });
    } catch (err) {
        // console.error('Failed to log IP:', err.message); // Clean logs
    }
}

function isPrivateIP(ip) {
    if (!ip) return false;
    return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');
}
