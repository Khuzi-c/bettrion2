const Parser = require('rss-parser');
const parser = new Parser();

const RSS_FEED_URL = 'https://casinos.einnews.com/rss/Mp_l4iv5yZ7AxJ0_';

// Cache for RSS feed
let cachedNews = [];
let lastFetch = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

exports.getNewsFromRSS = async (req, res) => {
    try {
        // Return cached data if still fresh
        if (cachedNews.length > 0 && lastFetch && (Date.now() - lastFetch < CACHE_DURATION)) {
            return res.json({ success: true, data: cachedNews, cached: true });
        }

        // Fetch fresh data
        const feed = await parser.parseURL(RSS_FEED_URL);

        const articles = feed.items.map(item => ({
            title: item.title || 'Untitled',
            link: item.link || '#',
            description: item.contentSnippet || item.content || item.description || 'No description available',
            pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
            image: extractImage(item) || 'https://via.placeholder.com/400x200?text=Casino+News',
            source: 'EIN News - Casino Industry'
        }));

        cachedNews = articles;
        lastFetch = Date.now();

        res.json({ success: true, data: articles, cached: false });
    } catch (err) {
        console.error('RSS Feed Error:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch news feed',
            data: cachedNews.length > 0 ? cachedNews : [] // Return cached data as fallback
        });
    }
};

// Extract image from RSS item
function extractImage(item) {
    // Try various image fields
    if (item.enclosure && item.enclosure.url) {
        return item.enclosure.url;
    }

    if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
        return item['media:content'].$.url;
    }

    if (item['media:thumbnail'] && item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
        return item['media:thumbnail'].$.url;
    }

    // Try to extract from content/description
    if (item.content || item.description) {
        const content = item.content || item.description;
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch && imgMatch[1]) {
            return imgMatch[1];
        }
    }

    return null;
}

// Manual refresh endpoint (admin only)
exports.refreshNewsCache = async (req, res) => {
    try {
        cachedNews = [];
        lastFetch = null;

        const feed = await parser.parseURL(RSS_FEED_URL);
        const articles = feed.items.map(item => ({
            title: item.title || 'Untitled',
            link: item.link || '#',
            description: item.contentSnippet || item.content || item.description || 'No description available',
            pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
            image: extractImage(item) || 'https://via.placeholder.com/400x200?text=Casino+News',
            source: 'EIN News - Casino Industry'
        }));

        cachedNews = articles;
        lastFetch = Date.now();

        res.json({ success: true, message: 'News cache refreshed', count: articles.length });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
