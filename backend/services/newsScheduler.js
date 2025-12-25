const axios = require('axios');
const supabase = require('../config/supabase');

const API_KEY = 'pub_509a08bf79544bfd8aaa73ba3404ffd2';
const QUERY = 'Casino';
const LANGUAGE = 'en';

// Helper to get random delay between 10 and 60 minutes
function getRandomDelay() {
    const min = 10 * 60 * 1000; // 10 minutes
    const max = 60 * 60 * 1000; // 60 minutes
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function fetchAndSaveNews() {
    console.log('📰 NewsScheduler: Fetching latest news...');
    try {
        const url = `https://newsdata.io/api/1/latest?apikey=${API_KEY}&q=${QUERY}&language=${LANGUAGE}`;
        const response = await axios.get(url);

        if (response.data.status !== 'success') {
            console.error('📰 NewsScheduler Error: API returned status', response.data.status);
            return;
        }

        const articles = response.data.results || [];
        let newCount = 0;

        for (const item of articles) {
            // Check if exists
            const { count } = await supabase
                .from('articles')
                .select('*', { count: 'exact', head: true })
                .eq('title', item.title);

            if (count === 0) {
                // Insert
                const { error } = await supabase
                    .from('articles')
                    .insert([{
                        title: item.title,
                        slug: slugify(item.title) + '-' + Date.now().toString().slice(-4),
                        content: item.description || item.content || 'No content provided.',
                        thumbnail: item.image_url || null, // API uses image_url
                        author: item.source_id || 'NewsData',
                        tags: ['News', 'Casino'],
                        is_active: true,
                        created_at: new Date(item.pubDate || Date.now())
                    }]);

                if (!error) newCount++;
                else console.error('📰 Save Error:', error.message);
            }
        }

        console.log(`📰 NewsScheduler: Saved ${newCount} new articles.`);

    } catch (error) {
        console.error('📰 NewsScheduler Error:', error.message);
    }
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

function startScheduler() {
    console.log('📰 NewsScheduler: Service Started.');

    // Initial Run
    fetchAndSaveNews();

    // Schedule Next
    const scheduleNext = () => {
        const delay = getRandomDelay();
        console.log(`📰 NewsScheduler: Next fetch in ${Math.round(delay / 60000)} minutes.`);
        setTimeout(async () => {
            await fetchAndSaveNews();
            scheduleNext();
        }, delay);
    };

    scheduleNext();
}

module.exports = { startScheduler };
