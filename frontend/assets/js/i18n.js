// Simple i18n Translation System & Auto-Translator
// Lightweight translation engine for vanilla JavaScript

class I18n {
    constructor() {
        this.locale = localStorage.getItem('locale') || this.detectLocale();
        this.translations = {};
        this.fallbackLocale = 'en';
        this.isTranslating = false;
    }

    detectLocale() {
        // Priority 1: URL Path
        const pathSegments = window.location.pathname.split('/');
        const firstSegment = pathSegments[1];
        const supported = ['en', 'ar', 'nl', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'tr'];

        if (supported.includes(firstSegment)) {
            return firstSegment;
        }

        // Priority 2: LocalStorage
        if (localStorage.getItem('locale')) {
            return localStorage.getItem('locale');
        }

        // Priority 3: Browser
        const browserLang = navigator.language.split('-')[0];
        return supported.includes(browserLang) ? browserLang : 'en';
    }

    // Expose for header select
    updateLang(newLang) {
        if (this.locale === newLang) return;

        const pathSegments = window.location.pathname.split('/');
        const firstSegment = pathSegments[1];
        const supported = ['en', 'ar', 'nl', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'tr'];

        let newPath;
        if (supported.includes(firstSegment)) {
            // Replace existing lang: /es/casinos -> /fr/casinos
            pathSegments[1] = newLang;
            newPath = pathSegments.join('/');
        } else {
            // Prepend new lang: /casinos -> /fr/casinos
            // Handle root /
            if (window.location.pathname === '/') {
                newPath = `/${newLang}`;
            } else {
                newPath = `/${newLang}${window.location.pathname}`;
            }
        }

        // Save preference
        localStorage.setItem('locale', newLang);

        // Redirect
        window.location.href = newPath;
    }

    async init() {
        // Apply direction immediately
        this.updateHtmlLang();

        if (this.locale === 'en') return; // No translation needed for English (source)

        // Show loading indicator if switching languages
        const existingLoader = document.getElementById('i18n-loader');
        if (!existingLoader && document.readyState !== 'loading') {
            // Optional: Add simple loader
        }

        await this.translatePageDynamic();
    }

    /**
     * Scans the DOM for text nodes and auto-translates them via Backend API
     */
    async translatePageDynamic() {
        if (this.isTranslating) return;
        this.isTranslating = true;

        const textNodes = [];
        const uniqueTexts = new Set();
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

        let node;
        while (node = walker.nextNode()) {
            const text = node.nodeValue.trim();
            // Filter out empty, numbers, scripts, styles
            if (
                text.length > 2 &&
                !/^\d+$/.test(text) &&
                node.parentElement.tagName !== 'SCRIPT' &&
                node.parentElement.tagName !== 'STYLE' &&
                node.parentElement.tagName !== 'NOSCRIPT' &&
                !node.parentElement.closest('[data-no-translate]')
            ) {
                textNodes.push(node);
                uniqueTexts.add(text);
            }
        }

        // Also get placeholders and titles
        const attributesToTranslate = ['placeholder', 'title', 'alt'];
        const attributeNodes = [];
        document.querySelectorAll('*').forEach(el => {
            attributesToTranslate.forEach(attr => {
                const val = el.getAttribute(attr);
                if (val && val.trim().length > 2) {
                    attributeNodes.push({ el, attr, text: val.trim() });
                    uniqueTexts.add(val.trim());
                }
            });
        });

        if (uniqueTexts.size === 0) {
            this.isTranslating = false;
            return;
        }

        console.log(`[i18n] Translating ${uniqueTexts.size} unique strings to ${this.locale}...`);

        try {
            // Batch request to backend
            const textsArray = Array.from(uniqueTexts);
            const response = await fetch('/api/ui/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textsArray,
                    target: this.locale
                })
            });

            const resData = await response.json();
            if (resData.success) {
                const translations = resData.data;

                // Apply to Text Nodes
                textNodes.forEach(node => {
                    const original = node.nodeValue.trim();
                    if (translations[original]) {
                        node.nodeValue = node.nodeValue.replace(original, translations[original]);
                    }
                });

                // Apply to Attributes
                attributeNodes.forEach(item => {
                    if (translations[item.text]) {
                        item.el.setAttribute(item.attr, translations[item.text]);
                    }
                });

                // Save to simple cache for quick subsequent lookups in session
                this.translations = { ...this.translations, ...translations };
            }
        } catch (err) {
            console.error('[i18n] Translation failed:', err);
        } finally {
            this.isTranslating = false;
        }
    }

    setLocale(locale) {
        if (this.locale === locale) return;
        this.locale = locale;
        localStorage.setItem('locale', locale);
        this.updateHtmlLang();
        window.location.reload(); // Simple reload to reset DOM and re-translate
    }

    updateHtmlLang() {
        document.documentElement.lang = this.locale;
        if (this.locale === 'ar') {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }
    }

    getLocale() {
        return this.locale;
    }
}

// Global instance
const i18n = new I18n();
window.i18n = i18n;
// Global helper for the header select
window.updateLang = (lang) => i18n.updateLang(lang);

// Auto-run on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
    i18n.init();
}
