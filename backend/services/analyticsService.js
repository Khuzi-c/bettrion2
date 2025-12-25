const jsonService = require('./jsonService');

const ANALYTICS_FILE = 'analytics.json';
const PLATFORMS_FILE = 'platforms.json';
const ARTICLES_FILE = 'articles.json';

const analyticsService = {
    trackView: (data) => {
        // data: { item_type, item_id, ip, country, device, referrer }
        const entry = {
            id: jsonService.generateId(),
            type: 'view',
            timestamp: new Date().toISOString(),
            ...data
        };

        const analytics = jsonService.loadJson(ANALYTICS_FILE);
        analytics.push(entry);
        jsonService.saveJson(ANALYTICS_FILE, analytics);

        // Update counter on the item itself
        if (data.item_type === 'platform') {
            const items = jsonService.loadJson(PLATFORMS_FILE);
            const index = items.findIndex(i => i.id === data.item_id);
            if (index !== -1) {
                items[index].views = (items[index].views || 0) + 1;
                jsonService.saveJson(PLATFORMS_FILE, items);
            }
        } else if (data.item_type === 'article') {
            const items = jsonService.loadJson(ARTICLES_FILE);
            const index = items.findIndex(i => i.id === data.item_id);
            if (index !== -1) {
                items[index].views = (items[index].views || 0) + 1; // Assuming articles have views too
                // Although schema in prompt didn't explicitly show views for articles, it's good practice
                // implementation_plan didn't explicitly ban it.
                // Re-reading prompt: "articles.json" schema doesn't have views. But prompt says "track view with analytics".
                // Allow it to update if field exists or just track in analytics.json
                // Prompt: "sync into platform/article 'views' & 'clicks' counters" -> YES sync.
                if (typeof items[index].views === 'undefined') items[index].views = 0;
                items[index].views += 1;
                jsonService.saveJson(ARTICLES_FILE, items);
            }
        }
    },

    trackClick: (data) => {
        const entry = {
            id: jsonService.generateId(),
            type: 'click',
            timestamp: new Date().toISOString(),
            ...data
        };
        const analytics = jsonService.loadJson(ANALYTICS_FILE);
        analytics.push(entry);
        jsonService.saveJson(ANALYTICS_FILE, analytics);

        // Sync clicks
        if (data.item_type === 'platform') {
            const items = jsonService.loadJson(PLATFORMS_FILE);
            const index = items.findIndex(i => i.id === data.item_id);
            if (index !== -1) {
                items[index].clicks = (items[index].clicks || 0) + 1;
                jsonService.saveJson(PLATFORMS_FILE, items);
            }
        }
    },

    getStats: (period) => {
        // Simple aggregation logic for dashboard
        const analytics = jsonService.loadJson(ANALYTICS_FILE);
        // This would be filtered by date in a real query
        return analytics;
    }
};

module.exports = analyticsService;
