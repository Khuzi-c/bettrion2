const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const axios = require('axios'); // Use axios which is already installed
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Config
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

/**
 * Hash helper for cache keys
 */
function hashText(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Translate a single text string
 */
exports.translateText = async (text, targetLang, sourceLang = 'en', context = 'dynamic') => {
    if (!text || !targetLang || targetLang === 'en') return text; // No translation needed

    try {
        const hash = hashText(text);

        // 1. Check Cache
        const { data: cached } = await supabase
            .from('translations_cache')
            .select('translated_text')
            .eq('source_hash', hash)
            .eq('target_language', targetLang)
            .single();

        if (cached) {
            return cached.translated_text;
        }

        // 2. Call Google API
        if (!GOOGLE_TRANSLATE_API_KEY) {
            console.warn('Missing GOOGLE_TRANSLATE_API_KEY. Returning original text.');
            return text;
        }

        const response = await axios.post(`${GOOGLE_TRANSLATE_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`, {
            q: text,
            source: sourceLang,
            target: targetLang,
            format: 'text'
        });

        const translatedText = response.data?.data?.translations?.[0]?.translatedText;

        if (!translatedText) {
            console.warn(`Translation API returned empty/null for: "${text.substring(0, 30)}..."`);
            return text; // Return original, do NOT cache
        }

        // Decode HTML entities if Google returns them (e.g. &#39; -> ')
        // Simple decode for common ones or leave as is if frontend handles it. 
        // Google usually returns safe HTML.

        // 3. Save to Cache (Fire & Forget)
        supabase.from('translations_cache').insert({
            source_hash: hash,
            original_text: text,
            translated_text: translatedText,
            source_language: sourceLang,
            target_language: targetLang,
            context
        }).then(({ error }) => {
            if (error) console.error('Cache Save Error:', error.message);
        });

        return translatedText;

    } catch (err) {
        // Log detailed error from Google
        if (err.response) {
            console.error('Google Translation Error:', err.response.data?.error?.message || err.response.statusText);
        } else {
            console.error('Translation Service Error:', err.message);
        }
        return text; // Fallback
    }
};

/**
 * Bulk Translate Objects
 * Useful for translating entire articles or casino objects
 */
exports.translateObject = async (obj, fieldsToTranslate, targetLang) => {
    if (!obj || !targetLang || targetLang === 'en') return obj;

    const newObj = { ...obj };

    for (const field of fieldsToTranslate) {
        if (newObj[field] && typeof newObj[field] === 'string') {
            newObj[field] = await exports.translateText(newObj[field], targetLang, 'en', 'db_content');
        }
    }

    return newObj;
};
